import { NextRequest, NextResponse } from "next/server";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/data/customer";
import { DatabaseError } from "pg";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Customer ID is missing" }, { status: 400 });
  }
  try {
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(customer, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch customer";
    console.error(`Error fetching customer ${id}:`, message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Customer ID is missing for update" }, { status: 400 });
  }
  try {
    const updatedCustomerData = await req.json();
    const updatedCustomer = await updateCustomer(id, updatedCustomerData);
    if (!updatedCustomer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error updating customer ${id}:`, error);
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
      error instanceof Error ? error.message : "Failed to update customer";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Customer ID is missing for deletion" }, { status: 400 });
  }
  try {
    const deletedCustomer = await deleteCustomer(id);
    if (!deletedCustomer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Customer deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete customer";
    console.error(`Error deleting customer ${id}:`, message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}