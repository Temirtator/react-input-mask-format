import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, Controller } from "react-hook-form";
import InputMask, { useMask } from "../../src/index";
import { kzPhone, kzIin } from "../../src/presets";
import { isValidIin } from "../../src/validators";
import { NumberFormat } from "../../src/number";
import { DateFormat } from "../../src/date";
import { CardNumberFormat, CardExpiryFormat } from "../../src/card";

type PhoneForm = { phone: string; iin: string };

function ControlledForm({ onSubmit }: { onSubmit: (data: PhoneForm) => void }) {
  const { control, handleSubmit } = useForm<PhoneForm>({ defaultValues: { phone: "", iin: "" } });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="phone"
        control={control}
        rules={{
          required: "Enter a phone",
          validate: (v) => !v.includes("_") || "Enter the full number",
        }}
        render={({ field, fieldState }) => (
          <>
            <InputMask {...kzPhone} {...field} data-testid="phone" />
            {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
          </>
        )}
      />
      <Controller
        name="iin"
        control={control}
        rules={{ validate: (v) => isValidIin(v) || "Invalid IIN" }}
        render={({ field, fieldState }) => (
          <>
            <InputMask {...kzIin} {...field} data-testid="iin" />
            {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
          </>
        )}
      />
      <button type="submit">Send</button>
    </form>
  );
}

describe("recipe: react-hook-form + InputMask via Controller", () => {
  it("submits masked values when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledForm onSubmit={onSubmit} />);
    await user.click(screen.getByTestId("phone"));
    await user.keyboard("012345678");
    await user.click(screen.getByTestId("iin"));
    await user.keyboard("901010123458");
    await user.click(screen.getByText("Send"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ phone: "+7 (701) 234-56-78", iin: "901010123458" });
  });

  it("rejects an incomplete phone and an invalid IIN with messages", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledForm onSubmit={onSubmit} />);
    await user.click(screen.getByTestId("phone"));
    await user.keyboard("01");
    await user.click(screen.getByTestId("iin"));
    await user.keyboard("901010123450");
    await user.click(screen.getByText("Send"));
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((a) => a.textContent)).toEqual(["Enter the full number", "Invalid IIN"]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires the phone when it is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledForm onSubmit={onSubmit} />);
    await user.click(screen.getByText("Send"));
    const alerts = await screen.findAllByRole("alert");
    expect(alerts[0]).toHaveTextContent("Enter a phone");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the error after the value is fixed", async () => {
    const user = userEvent.setup();
    render(<ControlledForm onSubmit={vi.fn()} />);
    await user.click(screen.getByTestId("phone"));
    await user.keyboard("012345678");
    await user.click(screen.getByTestId("iin"));
    await user.keyboard("901010123450");
    await user.click(screen.getByText("Send"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid IIN");
    await user.clear(screen.getByTestId("iin"));
    await user.keyboard("901010123458");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});

function RegisterForm({ onSubmit }: { onSubmit: (data: { phone: string }) => void }) {
  const { register, handleSubmit, formState } = useForm<{ phone: string }>();
  const { ref, ...rest } = register("phone", {
    required: "Enter a phone",
    validate: (v) => !v.includes("_") || "Enter the full number",
  });
  const maskRef = useMask(kzPhone);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...rest}
        ref={(el) => {
          ref(el);
          maskRef(el);
        }}
        data-testid="phone"
      />
      {formState.errors.phone && <p role="alert">{formState.errors.phone.message}</p>}
      <button type="submit">Send</button>
    </form>
  );
}

describe("recipe: react-hook-form + useMask via register", () => {
  it("submits the masked value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} />);
    await user.click(screen.getByTestId("phone"));
    await user.keyboard("012345678");
    await user.click(screen.getByText("Send"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ phone: "+7 (701) 234-56-78" });
  });

  it("keeps masking across formState re-renders and clears the error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} />);
    const input = screen.getByTestId("phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("01");
    await user.click(screen.getByText("Send"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter the full number");
    expect(input).toHaveFocus();
    await user.keyboard("2345678");
    expect(input).toHaveValue("+7 (701) 234-56-78");
    await user.click(screen.getByText("Send"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

type Mixed = { amount: string; born: string; card: string; expiry: string };

function ComponentsForm({ onSubmit }: { onSubmit: (data: Mixed) => void }) {
  const { control, handleSubmit, setFocus } = useForm<Mixed>({
    mode: "onBlur",
    defaultValues: { amount: "", born: "", card: "", expiry: "" },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <NumberFormat
            name={field.name}
            ref={field.ref}
            value={field.value}
            onValueChange={(v) => field.onChange(v.value)}
            onBlur={field.onBlur}
            thousandSeparator=","
            decimalScale={2}
            data-testid="amount"
          />
        )}
      />
      <Controller
        name="born"
        control={control}
        rules={{ required: "Enter a date" }}
        render={({ field, fieldState }) => (
          <>
            <DateFormat
              name={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={(v) => field.onChange(v.value)}
              onBlur={field.onBlur}
              data-testid="born"
            />
            {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
          </>
        )}
      />
      <Controller
        name="card"
        control={control}
        render={({ field }) => (
          <CardNumberFormat
            name={field.name}
            ref={field.ref}
            value={field.value}
            onValueChange={(v) => field.onChange(v.value)}
            onBlur={field.onBlur}
            data-testid="card"
          />
        )}
      />
      <Controller
        name="expiry"
        control={control}
        render={({ field }) => (
          <CardExpiryFormat
            name={field.name}
            ref={field.ref}
            value={field.value}
            onValueChange={(v) => field.onChange(v.value)}
            onBlur={field.onBlur}
            data-testid="expiry"
          />
        )}
      />
      <button type="button" onClick={() => setFocus("born")}>
        Focus date
      </button>
      <button type="submit">Send</button>
    </form>
  );
}

describe("recipe: react-hook-form + number, date and card components", () => {
  it("stores raw number, ISO date and digits-only card number", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ComponentsForm onSubmit={onSubmit} />);
    await user.click(screen.getByTestId("amount"));
    await user.keyboard("1234.5");
    await user.click(screen.getByTestId("born"));
    await user.keyboard("12052024");
    await user.click(screen.getByTestId("card"));
    await user.keyboard("4242424242424242");
    await user.click(screen.getByTestId("expiry"));
    await user.keyboard("0530");
    expect(screen.getByTestId("expiry")).toHaveValue("05/30");
    expect(screen.getByTestId("amount")).toHaveValue("1,234.5");
    expect(screen.getByTestId("born")).toHaveValue("12.05.2024");
    expect(screen.getByTestId("card")).toHaveValue("4242 4242 4242 4242");
    await user.click(screen.getByText("Send"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      amount: "1234.5",
      born: "2024-05-12",
      card: "4242424242424242",
      expiry: "05/30",
    });
  });

  it("focuses the date input on error and via setFocus", async () => {
    const user = userEvent.setup();
    render(<ComponentsForm onSubmit={vi.fn()} />);
    await user.click(screen.getByText("Send"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a date");
    await waitFor(() => expect(screen.getByTestId("born")).toHaveFocus());
    await user.click(screen.getByTestId("amount"));
    await user.click(screen.getByText("Focus date"));
    expect(screen.getByTestId("born")).toHaveFocus();
  });

  it("rejects a partial date on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ComponentsForm onSubmit={onSubmit} />);
    await user.click(screen.getByTestId("born"));
    await user.keyboard("1205");
    await user.click(screen.getByText("Send"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a date");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates on blur through field.onBlur", async () => {
    const user = userEvent.setup();
    render(<ComponentsForm onSubmit={vi.fn()} />);
    await user.click(screen.getByTestId("born"));
    await user.keyboard("12");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.tab();
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a date");
  });
});
