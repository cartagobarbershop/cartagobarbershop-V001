import React, { useState } from "react";
import { Scissors, User, Phone, Lock, ChevronRight, ArrowLeft } from "lucide-react";

interface LoginPageProps {
  onBack: () => void;
  onLogin: (role: string, identifier: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLogin }) => {
  const [role, setRole] = useState<"OWNER" | "BARBER" | "RECEPTION" | "CLIENT">(
    "CLIENT"
  );
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "CLIENT") {
      if (identifier) onLogin(role, identifier);
    } else {
      // For simulation, any PIN works for staff, or just bypass for now
      onLogin(role, identifier || role.toLowerCase());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onBack}
          className="group mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a inicio
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200">
            <Scissors className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          ¡Bienvenido de nuevo!
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Accede a tu perfil de {role === "CLIENT" ? "cliente" : "staff"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200 sm:rounded-3xl sm:px-10 border border-slate-100">
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button
              onClick={() => setRole("CLIENT")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                role === "CLIENT"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              CLIENTE
            </button>
            <button
              onClick={() => setRole("OWNER")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                role !== "CLIENT"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              EQUIPO
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {role !== "CLIENT" && (
              <div>
                <label
                  htmlFor="role-select"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  Rol de Trabajo
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="block w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="OWNER">Dueño (Owner)</option>
                  <option value="BARBER">Barbero</option>
                  <option value="RECEPTION">Recepción</option>
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-bold text-slate-700 mb-2"
              >
                {role === "CLIENT" ? "Número de Teléfono" : "Nombre de Usuario"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {role === "CLIENT" ? (
                    <Phone className="h-5 w-5 text-slate-400" />
                  ) : (
                    <User className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type={role === "CLIENT" ? "tel" : "text"}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder={role === "CLIENT" ? "Tu número celular" : "Tu usuario"}
                />
              </div>
            </div>

            {role !== "CLIENT" && (
              <div>
                <label htmlFor="pin" className="block text-sm font-bold text-slate-700 mb-2">
                  PIN de Acceso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                    placeholder="••••"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-100 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] group"
              >
                Ingresar al Sistema
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>

          {role === "CLIENT" && (
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Al ingresar, aceptas nuestra política de privacidad y el uso de
                tus datos para el programa de lealtad.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
