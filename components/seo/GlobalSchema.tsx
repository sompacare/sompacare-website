import { JsonLd } from "@/components/seo/JsonLd";
import { globalSchema } from "@/lib/schema";

export function GlobalSchema() {
  return <JsonLd data={globalSchema()} />;
}
