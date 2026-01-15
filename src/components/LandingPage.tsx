import React, { useState } from "react";
import {
  Scissors,
  Calendar,
  Award,
  Star,
  Clock,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  ChevronRight,
  Shield,
  FileText,
  Cookie
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onJoin: () => void;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
}

const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onJoin,
  socialLinks
}) => {
  const heroImage =
    "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
  const [activePolicy, setActivePolicy] = useState<"privacy" | "terms" | "cookies" | null>(
    null
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Barbería Premium
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#services"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Servicios
              </a>
              <a
                href="#about"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Nosotros
              </a>
              <a
                href="#gallery"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Estilos
              </a>
              <button
                onClick={onLogin}
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={onJoin}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                Reservar Ahora
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left space-y-8">
              <div className="flex justify-center md:justify-start">
                <img
                  src="/img_styles/barbershop_logo.png"
                  alt="Barbershop logo"
                  className="h-14 w-auto rounded-2xl border border-blue-100 shadow-lg shadow-blue-100 bg-white/80 p-2"
                  loading="lazy"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 animate-fade-in">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  La mejor barbería de la ciudad
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Eleva tu{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Estilo
                </span>
                <br />
                con Maestría
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Combinamos técnicas tradicionales con arte moderno para ofrecerte
                un servicio excepcional. Más que un corte, es una experiencia de
                cuidado personal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <button
                  onClick={onJoin}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                >
                  Agendar Mi Cita
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogin}
                  className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  Ver Mi Perfil
                </button>
              </div>

              <div className="flex items-center gap-8 justify-center md:justify-start pt-8 border-t border-slate-100">
                <div>
                  <div className="text-2xl font-bold text-slate-900">2K+</div>
                  <div className="text-xs text-slate-500 font-medium">
                    Clientes Felices
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">15+</div>
                  <div className="text-xs text-slate-500 font-medium">
                    Años de Experticia
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">4.9/5</div>
                  <div className="text-xs text-slate-500 font-medium">
                    Rating Promedio
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-600/5 blur-2xl rounded-3xl group-hover:bg-blue-600/10 transition-colors"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-100 aspect-[4/5] transform hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={heroImage}
                  alt="Barbero trabajando"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-8 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden"
                        >
                          <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="avatar" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-semibold">
                      +10 citas para hoy
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-subtle">
                <div className="bg-green-100 p-2 rounded-xl">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Próximo Turno
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Disponible 10:30 AM
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest">
              Nuestros Servicios
            </h2>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Experiencias de Cuidado Diseñadas Para Ti
            </p>
            <p className="text-slate-600">
              Desde cortes clásicos hasta el diseño de barba más detallado,
              nuestro equipo está listo para transformar tu imagen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Scissors className="w-8 h-8" />,
                title: "Corte Premier",
                desc: "Corte personalizado según tu tipo de rostro y cabello.",
                price: "Desde $45.000"
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "Spa de Barba",
                desc: "Ritual completo de afeitado con toallas calientes y aceites esenciales.",
                price: "Desde $15.000"
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Paquete Loyalty",
                desc: "Suscripción mensual con beneficios exclusivos y prioridad en turnos.",
                price: "Consultar"
              }
            ].map((service, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  {service.title}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {service.desc}
                </p>
                                <div className="text-blue-600 font-bold">{service.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section id="gallery" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl space-y-4">
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                Catálogo de Estilos
              </h2>
              <p className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Encuentra Tu Referencia Ideal
              </p>
            </div>
            <button
              onClick={onLogin}
              className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              Ver galería completa <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: "HC-01", name: "Corte Texturizado", img: "/img_styles/hc-01.jpg" },
              { id: "HC-07", name: "Quiff Estilizado", img: "/img_styles/hc-07.jpg" },
              { id: "B-04", name: "Barba Larga", img: "/img_styles/B-04.jpg" },
              { id: "HC-30", name: "Pompadour Suelto", img: "/img_styles/hc-30.jpg" }
            ].map((style, idx) => (
              <div
                key={idx}
                className="relative group rounded-3xl overflow-hidden aspect-square shadow-lg"
              >
                <img
                  src={style.img}
                  alt={style.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                    {style.id}
                  </div>
                  <div className="text-lg font-bold text-white">{style.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-blue-400">99%</div>
              <div className="text-sm text-slate-400 font-medium">Satisfacción</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-blue-400">12k+</div>
              <div className="text-sm text-slate-400 font-medium">
                Cortes Realizados
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-blue-400">5</div>
              <div className="text-sm text-slate-400 font-medium">
                Barberos Expertos
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-extrabold text-blue-400">1k+</div>
              <div className="text-sm text-slate-400 font-medium">
                Miembros Gold
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  Barbería Premium
                </span>
              </div>
              <p className="text-slate-600 max-w-sm leading-relaxed">
                Nuestra misión es ayudar a cada cliente a encontrar su mejor
                versión a través de un servicio de alta calidad.
              </p>
              <div className="flex gap-4">
                <a
                  href={socialLinks?.instagram || "#"}
                  className="p-3 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href={socialLinks?.facebook || "#"}
                  className="p-3 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href={socialLinks?.tiktok || "#"}
                  className="p-3 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  aria-label="TikTok"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M16 3c.3 2.6 2.1 4.7 4.6 5v3.1c-1.7 0-3.3-.5-4.6-1.4v6.1a6.5 6.5 0 1 1-6.5-6.5c.3 0 .6 0 .9.1v3.3a3.4 3.4 0 1 0 2.2 3.2V3h3.4z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Contacto
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Calle 123 #45-67, Bogotá, Colombia</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>+57 300 123 4567</span>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Horario
              </h4>
              <ul className="space-y-3 text-slate-600">
                <li className="flex justify-between">
                  <span>Lunes:</span>
                  <span className="font-semibold">Cerrado</span>
                </li>
                <li className="flex justify-between">
                  <span>Mar - Vie:</span>
                  <span className="font-semibold">10:00 - 19:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Sábado:</span>
                  <span className="font-semibold">10:00 - 19:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Domingo:</span>
                  <span className="font-semibold">Cerrado</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              © 2026 Barbería Premium. Todos los derechos reservados.
            </p>
            <div className="flex gap-8 text-xs font-semibold text-slate-400">
              <button
                type="button"
                onClick={() => setActivePolicy(activePolicy === "privacy" ? null : "privacy")}
                className="hover:text-slate-600"
                aria-controls="privacy"
                data-expanded={activePolicy === "privacy"}
              >
                Privacidad
              </button>
              <button
                type="button"
                onClick={() => setActivePolicy(activePolicy === "terms" ? null : "terms")}
                className="hover:text-slate-600"
                aria-controls="terms"
                data-expanded={activePolicy === "terms"}
              >
                Términos
              </button>
              <button
                type="button"
                onClick={() => setActivePolicy(activePolicy === "cookies" ? null : "cookies")}
                className="hover:text-slate-600"
                aria-controls="cookies"
                data-expanded={activePolicy === "cookies"}
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

      <section
        id="privacy"
        className={`py-20 bg-slate-50 border-t border-slate-100 ${
          activePolicy === "privacy" ? "block" : "hidden"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Privacidad</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Tu información, siempre protegida
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Recopilamos únicamente los datos necesarios para gestionar tus citas, historial y
            recompensas. Nunca vendemos tu información a terceros y puedes solicitar la
            eliminación de tus datos en cualquier momento.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-sm font-bold text-slate-900 mb-2">Datos que usamos</div>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Nombre y teléfono para confirmar citas</li>
                <li>Historial de servicios para recomendaciones</li>
                <li>Preferencias de comunicación</li>
              </ul>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-sm font-bold text-slate-900 mb-2">Tus derechos</div>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Acceso a tu información</li>
                <li>Actualización o corrección</li>
                <li>Solicitud de eliminación</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        id="terms"
        className={`py-20 bg-white border-t border-slate-100 ${
          activePolicy === "terms" ? "block" : "hidden"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Términos</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Transparencia para tu tranquilidad
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Al reservar una cita aceptas nuestras políticas de puntualidad y cancelación.
            Puedes reprogramar sin costo hasta 6 horas antes de tu cita. Las llegadas tardías
            pueden reducir el tiempo de servicio.
          </p>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-sm font-bold text-slate-900 mb-2">Resumen</div>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>Reprogramaciones flexibles con aviso previo</li>
              <li>Pagos seguros y confirmación inmediata</li>
              <li>Beneficios de lealtad sujetos a disponibilidad</li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="cookies"
        className={`py-20 bg-slate-50 border-t border-slate-100 ${
          activePolicy === "cookies" ? "block" : "hidden"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <Cookie className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Cookies</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Experiencia personalizada
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Utilizamos cookies y almacenamiento local para recordar tus preferencias,
            mantener tu sesión activa y optimizar tu experiencia. Puedes desactivar estas
            funciones desde tu navegador, aunque algunas características pueden verse
            limitadas.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-sm font-bold text-slate-900 mb-1">Esenciales</div>
              <p className="text-sm text-slate-600">Mantienen tu sesión y seguridad.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-sm font-bold text-slate-900 mb-1">Preferencias</div>
              <p className="text-sm text-slate-600">Guarda idioma y tema.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-sm font-bold text-slate-900 mb-1">Analítica</div>
              <p className="text-sm text-slate-600">Nos ayuda a mejorar el servicio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `
        }}
      />
    </div>
  );
};

export default LandingPage;
