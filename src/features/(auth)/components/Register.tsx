"use client";

import { type FormEvent, useState } from "react";
import { getApiErrorMessage, useRegister } from "../hooks/use-auth";
import { registerSchema, toFieldErrors } from "../schema/auth.schema";
import AuthField from "./AuthField";
import AuthShell from "./AuthShell";
import AuthSubmitButton from "./AuthSubmitButton";

export default function Register() {
  const register = useRegister();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pending = register.isPending;

  const setField = (key: keyof typeof values) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    register.mutate(parsed.data);
  };

  return (
    <AuthShell
      activeTab="daftar"
      pending={pending}
      googleLabel="Daftar Dengan Google"
      error={register.isError ? getApiErrorMessage(register.error) : undefined}
    >
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <AuthField
          id="name"
          label="Nama"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap"
          value={values.name}
          onChange={(e) => setField("name")(e.target.value)}
          error={errors.name}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@gmail.com"
          value={values.email}
          onChange={(e) => setField("email")(e.target.value)}
          error={errors.email}
        />

        <AuthField
          id="password"
          label="Kata sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Masukkan kata sandi"
          value={values.password}
          onChange={(e) => setField("password")(e.target.value)}
          error={errors.password}
        />

        <AuthField
          id="confirm_password"
          label="Ulangi kata sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Masukkan ulang kata sandi"
          value={values.confirm_password}
          onChange={(e) => setField("confirm_password")(e.target.value)}
          error={errors.confirm_password}
        />

        <AuthSubmitButton pending={pending} />
      </form>
    </AuthShell>
  );
}
