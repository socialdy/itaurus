import { NextRequest, NextResponse } from "next/server";
import { createCustomer, getAllCustomers, getCustomerById } from "@/lib/data/customer"; // Import getCustomerById
import { DatabaseError } from "pg"; // Assuming 'pg' is the underlying driver

export async function POST(req: NextRequest) {
  try {
    const newCustomerData = await req.json();
    const customer = await createCustomer(newCustomerData);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating customer:", error);
    if (error instanceof DatabaseError && error.code === "23505") {
      if (error.constraint === "customer_abbreviation_unique") {
        return NextResponse.json(
          {
            message:
              "Ein Kunde mit diesem Kürzel existiert bereits. Bitte wählen Sie ein anderes Kürzel.",
          },
          { status: 409 }
        );
      }
    }
    const message =
      error instanceof Error ? error.message : "Failed to create customer";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const customer = await getCustomerById(id);
      if (customer) {
        return NextResponse.json(customer, { status: 200 });
      } else {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }
    }
    const customers = await getAllCustomers();
    return NextResponse.json(customers, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch customers";
    console.error("Error fetching customers:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}