import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 32 * 1024;

const MAX_NAME_LENGTH = 100;
const MAX_COMPANY_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_SERVICE_LENGTH = 150;
const MAX_SIZE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 3000;

const MAX_QUANTITY = 1_000_000_000;
const MAX_BUDGET = 1_000_000_000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // REQUEST SIZE
    // --------------------------------------------------

    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const contentLengthNumber = Number(contentLength);

      if (
        !Number.isFinite(contentLengthNumber) ||
        contentLengthNumber > MAX_BODY_SIZE
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Request is too large.",
          },
          { status: 413 },
        );
      }
    }

    // --------------------------------------------------
    // READ FORM DATA
    // --------------------------------------------------

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    const serviceName = String(formData.get("service") || "").trim();
    const productId = String(formData.get("product_id") || "").trim();

    const quantityText = String(formData.get("quantity") || "").trim();
    const size = String(formData.get("size") || "").trim();
    const budgetText = String(formData.get("budget") || "").trim();
    const description = String(formData.get("description") || "").trim();

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!name || !phone || !serviceName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide your name, phone number and service.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // LENGTH VALIDATION
    // --------------------------------------------------

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (company.length > MAX_COMPANY_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Company name must be ${MAX_COMPANY_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (phone.length > MAX_PHONE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Phone number must be ${MAX_PHONE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (serviceName.length > MAX_SERVICE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service.",
        },
        { status: 400 },
      );
    }

    if (size.length > MAX_SIZE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Size must be ${MAX_SIZE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // PRODUCT ID VALIDATION
    // --------------------------------------------------

    if (productId && !isValidUuid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // QUANTITY
    // --------------------------------------------------

    let quantity: number | null = null;

    if (quantityText) {
      const parsedQuantity = Number(quantityText);

      if (
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity <= 0 ||
        parsedQuantity > MAX_QUANTITY
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Quantity must be a valid positive whole number.",
          },
          { status: 400 },
        );
      }

      quantity = parsedQuantity;
    }

    // --------------------------------------------------
    // BUDGET
    // --------------------------------------------------

    let budget: number | null = null;

    if (budgetText) {
      const parsedBudget = Number(budgetText);

      if (
        !Number.isFinite(parsedBudget) ||
        parsedBudget < 0 ||
        parsedBudget > MAX_BUDGET
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Budget must be a valid amount.",
          },
          { status: 400 },
        );
      }

      budget = parsedBudget;
    }

    const supabase = await createClient();

    // --------------------------------------------------
    // FIND SERVICE
    // --------------------------------------------------

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("name", serviceName)
      .eq("is_active", true)
      .maybeSingle();

    if (serviceError) {
      console.error("Service lookup error:", serviceError);

      return NextResponse.json(
        {
          success: false,
          message: "We could not find the selected service.",
        },
        { status: 500 },
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected service is no longer available.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VALIDATE PRODUCT + CALCULATE PRICE
    // --------------------------------------------------

    let validProductId: string | null = null;
    let unitPrice: number | null = null;
    let estimatedTotal: number | null = null;

    if (productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, starting_price")
        .eq("id", productId)
        .eq("is_published", true)
        .maybeSingle();

      if (productError) {
        console.error("Product lookup error:", productError);

        return NextResponse.json(
          {
            success: false,
            message: "We could not verify the selected product.",
          },
          { status: 500 },
        );
      }

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: "The selected product is no longer available.",
          },
          { status: 400 },
        );
      }

      validProductId = product.id;

      // --------------------------------------------------
      // GET PRODUCT PRICING TIERS
      // --------------------------------------------------

      const { data: pricingTiers, error: pricingError } =
        await supabase
          .from("product_price_tiers")
          .select("minimum_quantity, unit_price")
          .eq("product_id", product.id)
          .order("minimum_quantity", {
            ascending: true,
          });

      if (pricingError) {
        console.error(
          "Product pricing lookup error:",
          pricingError,
        );

        return NextResponse.json(
          {
            success: false,
            message: "We could not calculate the product price.",
          },
          { status: 500 },
        );
      }

      // --------------------------------------------------
      // FIND APPLICABLE PRICE
      // --------------------------------------------------

      if (quantity !== null) {
        if (pricingTiers && pricingTiers.length > 0) {
          let applicablePrice: number | null = null;

          for (const tier of pricingTiers) {
            if (quantity >= tier.minimum_quantity) {
              applicablePrice = Number(tier.unit_price);
            } else {
              break;
            }
          }

          unitPrice = applicablePrice;
        } else if (product.starting_price !== null) {
          unitPrice = Number(product.starting_price);
        }

        // --------------------------------------------------
        // CALCULATE ESTIMATED TOTAL
        // --------------------------------------------------

        if (unitPrice !== null) {
          const calculatedTotal = unitPrice * quantity;

          if (
            !Number.isFinite(calculatedTotal) ||
            calculatedTotal < 0 ||
            calculatedTotal > Number.MAX_SAFE_INTEGER
          ) {
            return NextResponse.json(
              {
                success: false,
                message: "The requested quantity is too large.",
              },
              { status: 400 },
            );
          }

          estimatedTotal = calculatedTotal;
        }
      }
    }

    // --------------------------------------------------
    // CREATE CUSTOMER
    // --------------------------------------------------
    //
    // Anonymous visitors are allowed to INSERT customers,
    // but RLS does not allow them to UPDATE existing customers.
    //
    // Therefore we deliberately do not attempt a public UPDATE.
    // This preserves the current security boundary.
    // --------------------------------------------------

    const { data: newCustomer, error: createCustomerError } =
      await supabase
        .from("customers")
        .insert({
          full_name: name,
          email: email || null,
          phone,
          whatsapp: phone,
          company_name: company || null,
        })
        .select("id")
        .single();

    if (createCustomerError || !newCustomer) {
      console.error(
        "Customer creation error:",
        createCustomerError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "We could not create your customer record.",
        },
        { status: 500 },
      );
    }

    const customerId = newCustomer.id;

    // --------------------------------------------------
    // CREATE QUOTE
    // --------------------------------------------------

    const { error: quoteError } = await supabase
      .from("quotes")
      .insert({
        customer_id: customerId,
        service_id: service.id,
        product_id: validProductId,
        quantity,
        unit_price: unitPrice,
        estimated_total: estimatedTotal,
        size: size || null,
        budget,
        description: description || null,
        status: "pending",
      });

    if (quoteError) {
      console.error("Quote creation error:", quoteError);

      return NextResponse.json(
        {
          success: false,
          message: "We could not submit your quote request.",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.redirect(
      new URL("/?quote=success#quote", request.url),
    );
  } catch (error) {
    console.error(
      "Unexpected quote submission error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}