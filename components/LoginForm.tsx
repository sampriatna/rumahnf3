"use client";



import { useState } from "react";

import { PasswordInput } from "@/components/ui/PasswordInput";



type Props = {

  errorCode?: string;

  errorMode?: string;

  isDev: boolean;

  demoUsers: { phone: string; name: string; role: string }[];

  nextPath?: string;

};



const EMAIL_ERRORS: Record<string, { title: string; hint: string }> = {

  missing_fields: {

    title: "Email dan password wajib diisi.",

    hint: "Pastikan kedua kolom terisi sebelum klik Masuk."

  },

  invalid_credentials: {

    title: "Email atau password salah.",

    hint: "Cek lagi ejaan email, huruf besar/kecil password, dan simbol di awal password (mis. @). Password case-sensitive."

  },

  email_not_confirmed: {

    title: "Email belum diverifikasi di Supabase.",

    hint: "Buka Supabase Auth → Users → konfirmasi email akun ini, atau jalankan ulang npm run seed:admin."

  },

  account_inactive: {

    title: "Akun dinonaktifkan.",

    hint: "Hubungi admin untuk mengaktifkan kembali akun Anda di Kelola Staf."

  },

  account_not_registered: {

    title: "Login Supabase berhasil, tapi akun belum terdaftar di Rumah NF3.",

    hint: "Jalankan npm run seed:admin di komputer dev (setelah supabase/auth-app.sql). Atau pastikan email sama dengan NF3_SUPER_ADMIN_EMAIL di env Vercel."

  },

  no_supabase: {

    title: "Database belum terhubung di server ini.",

    hint: "Di Vercel: set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NF3_SUPER_ADMIN_EMAIL, NF3_SUPER_ADMIN_PASSWORD lalu redeploy."

  },

  server_error: {

    title: "Gagal menghubungi server auth.",

    hint: "Coba lagi beberapa detik. Jika masih gagal, cek koneksi internet atau status Supabase."

  },

  "1": {

    title: "Email atau password salah.",

    hint: "Gunakan tab Email (Owner/Admin), bukan HP + PIN."

  }

};



export function LoginForm({ errorCode, errorMode, isDev, demoUsers, nextPath }: Props) {

  const [mode, setMode] = useState<"email" | "phone">(

    errorMode === "phone" ? "phone" : "email"

  );



  const emailErr = errorMode === "email" && errorCode ? EMAIL_ERRORS[errorCode] : null;



  return (

    <>

      {errorMode === "kds-denied" && (

        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">

          KDS hanya untuk tablet dapur/bar. Akun pribadi staf tidak punya akses — gunakan tablet stasiun.

        </p>

      )}



      <div className="mb-4 flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">

        <button

          type="button"

          onClick={() => setMode("email")}

          className={`flex-1 rounded-md py-2 font-bold transition ${

            mode === "email" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500"

          }`}

        >

          Email (Owner/Admin)

        </button>

        <button

          type="button"

          onClick={() => setMode("phone")}

          className={`flex-1 rounded-md py-2 font-bold transition ${

            mode === "phone" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500"

          }`}

        >

          HP + PIN (Staf)

        </button>

      </div>



      {mode === "email" ? (

        <form action="/api/auth/login-email" method="POST" className="panel flex flex-col gap-4 p-6">

          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

          <div>

            <label htmlFor="email" className="text-sm font-bold text-slate-700">

              Email

            </label>

            <input

              id="email"

              name="email"

              type="email"

              autoComplete="email"

              required

              placeholder="owner@perusahaan.com"

              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-400/10"

            />

          </div>

          <div>

            <label htmlFor="password" className="text-sm font-bold text-slate-700">

              Password

            </label>

            <div className="mt-1">

              <PasswordInput id="password" name="password" />

            </div>

          </div>



          {emailErr && (

            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">

              <p className="font-bold">{emailErr.title}</p>

              <p className="mt-1 text-xs leading-relaxed text-rose-700">{emailErr.hint}</p>

            </div>

          )}



          <button type="submit" className="btn-primary mt-1">

            Masuk

          </button>

        </form>

      ) : (

        <form action="/api/auth/login-phone" method="POST" className="panel flex flex-col gap-4 p-6">

          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

          <div>

            <label htmlFor="phone" className="text-sm font-bold text-slate-700">

              Nomor HP

            </label>

            <input

              id="phone"

              name="phone"

              inputMode="numeric"

              autoComplete="username"

              required

              placeholder="08xxxxxxxxxx"

              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-400/10"

            />

          </div>

          <div>

            <label htmlFor="pin" className="text-sm font-bold text-slate-700">

              PIN

            </label>

            <div className="mt-1">

              <PasswordInput

                id="pin"

                name="pin"

                placeholder="••••"

                autoComplete="current-password"

                inputMode="numeric"

              />

            </div>

          </div>

          {errorMode === "phone" && errorCode && (

            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">

              Nomor HP atau PIN salah.

            </p>

          )}

          <button type="submit" className="btn-primary mt-1">

            Masuk

          </button>

        </form>

      )}



      {isDev && mode === "phone" && (

        <div className="panel mt-5 p-4 text-xs text-slate-500">

          <p className="mb-2 font-bold text-slate-600">Akun demo (PIN: 1234)</p>

          <ul className="space-y-0.5">

            {demoUsers.map((u) => (

              <li key={u.phone}>

                <span className="font-mono text-slate-700">{u.phone}</span> — {u.name} ({u.role})

              </li>

            ))}

          </ul>

        </div>

      )}

    </>

  );

}

