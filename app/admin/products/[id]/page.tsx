import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProductForm from "./EditProductForm";

export const instant = false;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      category_id,
      short_description,
      description,
      image_url,
      starting_price,
      price_unit,
      features,
      is_featured,
      is_published,
      sort_order,
      seo_title,
      seo_description
    `)
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  const { data: pricingTiers, error: pricingTiersError } = await supabase
    .from("product_price_tiers")
    .select("id, minimum_quantity, unit_price")
    .eq("product_id", id)
    .order("minimum_quantity", { ascending: true });

  if (pricingTiersError) {
    throw new Error(pricingTiersError.message);
  }

  const initialPricingTiers =
    pricingTiers && pricingTiers.length > 0
      ? pricingTiers
      : product.starting_price !== null
        ? [
            {
              id: "",
              minimum_quantity: 1,
              unit_price: product.starting_price,
            },
          ]
        : [
            {
              id: "",
              minimum_quantity: 1,
              unit_price: "",
            },
          ];

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24] md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] shadow-sm transition hover:border-[#6A0D8F] hover:text-[#6A0D8F]"
          >
            ← Back to Products
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#6A0D8F]">
            Catalog Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#211C24]">
            Edit Product
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Update this product and save the changes to your catalog.
          </p>
        </div>

        <EditProductForm
          product={product}
          categories={categories ?? []}
          pricingTiers={initialPricingTiers}
        />
      </div>
    </div>
  );
}