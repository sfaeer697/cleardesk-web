// Legacy Vercel shim. The site is deployed on Cloudflare Pages; this keeps the
// old Vercel project working until it is deleted. Delete `api/`, `vercel.json`
// and the Vercel project after the Cloudflare cutover.
import { onRequestGet } from '../functions/api/pricing.js';

export const GET = () => onRequestGet({ env: process.env });
