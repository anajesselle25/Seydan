export const WHATSAPP_NUMBER = "573134313385";

export function buildWhatsAppUrl(data, service) {
  const value = (key) => String(data[key] ?? "").trim();
  const price = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(service.precio);
  const message = [
    "Hola, Seydan. Quisiera cotizar una cita:",
    `Nombre: ${value("nombre")}`,
    `Teléfono: ${value("telefono")}`,
    `Correo: ${value("email")}`,
    `Servicio: ${service.nombre}`,
    `Fecha solicitada: ${value("fecha")}`,
    `Hora solicitada: ${value("hora")}`,
    `Duración estimada: ${service.duracion} minutos`,
    `Precio de referencia: ${price} COP`,
    `Notas: ${value("notas") || "Sin notas"}`,
    "Acepto la política de reservas: llegar 10 minutos antes y avisar con al menos 24 horas de anticipación si necesito cancelar.",
    "Los precios están sujetos a cambios y pueden no estar totalmente actualizados.",
    "Por favor, confirma la disponibilidad y el precio final.",
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}