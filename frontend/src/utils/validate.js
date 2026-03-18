export function validateName(v) {
  if (!v?.trim()) return "Name is required";
  if (!/^[a-zA-Z\u0900-\u097F\s.''-]+$/.test(v.trim())) return "Name can only contain letters, spaces, dots or hyphens";
  if (v.trim().length < 2) return "Name must be at least 2 characters";
  return null;
}
export function validatePhone(v) {
  if (!v) return null;
  const d = v.replace(/\D/g,"");
  if (d.length !== 10) return "Phone must be exactly 10 digits";
  if (!/^[6-9]/.test(d)) return "Must start with 6, 7, 8, or 9";
  return null;
}
export function validateEmail(v) {
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return null;
}
export function validateMeters(v) {
  const n = parseFloat(v);
  if (!v || isNaN(n) || n<=0) return "Enter valid meters > 0";
  if (n>10000) return "Value too large";
  return null;
}
export function validatePrice(v) {
  const n = parseFloat(v);
  if (!v || isNaN(n) || n<=0) return "Enter valid price > 0";
  return null;
}
