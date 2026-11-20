// Legacy Vercel shim. See api/pricing.js.
import { onRequestPost } from '../functions/api/checkout.js';

export const POST = () => onRequestPost({ env: process.env });
