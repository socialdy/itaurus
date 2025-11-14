import db from "@/db/drizzle";
import { customer, contactPerson, system } from "@/db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function createCustomer(newCustomer: {
  abbreviation: string;
  name: string;
  contactPersons: { name: string; email: string; phone: string; }[];
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  category?: string;
  billingCode?: string;
  serviceManager?: string;
  businessEmail?: string;
  businessPhone?: string;
  sla: boolean;
}) {
  const id = uuidv4();
  const customerToInsert = {
    id,
    abbreviation: newCustomer.abbreviation,
    name: newCustomer.name,
    address: newCustomer.address,
    city: newCustomer.city,
    postalCode: newCustomer.postalCode,
    country: newCustomer.country,
    category: newCustomer.category,
    billingCode: newCustomer.billingCode,
    serviceManager: newCustomer.serviceManager,
    businessEmail: newCustomer.businessEmail,
    businessPhone: newCustomer.businessPhone,
    sla: newCustomer.sla,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const result = await db.insert(customer).values(customerToInsert).returning();
  const createdCustomer = result[0];

  if (newCustomer.contactPersons && newCustomer.contactPersons.length > 0) {
    const contactPersonsToInsert = newCustomer.contactPersons.map(cp => ({
      id: uuidv4(),
      customerId: createdCustomer.id,
      name: cp.name,
      email: cp.email,
      phone: cp.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    try {
      await db.insert(contactPerson).values(contactPersonsToInsert);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
      ) {
        throw new Error("Ein Ansprechpartner mit dieser Kombination aus Name, E-Mail und Telefon existiert bereits für diesen Kunden.");
      }
      throw error;
    }
  }
  
  const fullCustomer = await getCustomerById(createdCustomer.id);
  return fullCustomer;
}

export async function getCustomerById(id: string) {
  const customerResult = await db.query.customer.findFirst({
    where: eq(customer.id, id),
    with: {
      contactPeople: true,
      systems: true, 
      maintenanceEntries: true,
    },
    columns: {
      id: true, // Ensure ID is always included
      abbreviation: true,
      name: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      category: true,
      billingCode: true,
      serviceManager: true,
      businessEmail: true,
      businessPhone: true,
      website: true,
      customerInstructions: true,
      sla: true, // Include SLA field
    }
  });

  console.log("[DEBUG] customerResult from DB:", JSON.stringify(customerResult, null, 2));
  if (customerResult && customerResult.systems) {
    customerResult.systems.forEach((sys: InferSelectModel<typeof system>, index: number) => {
      console.log(`[DEBUG] System ${index} - Hostname: ${sys.hostname}, IP Address: ${sys.ipAddress}`);
    });
  }

  if (!customerResult) {
    return null;
  }

  return customerResult;
}

type CustomerRow = {
  customer: typeof customer.$inferSelect;
  contactPerson: typeof contactPerson.$inferSelect | null;
};

export async function getAllCustomers() {
  try {
    const result = await db
      .select({
        customer: customer,
        contactPerson: contactPerson,
      })
      .from(customer)
      .leftJoin(contactPerson, eq(customer.id, contactPerson.customerId));

    console.log("[DEBUG] getAllCustomers - Drizzle query result:", JSON.stringify(result, null, 2));

    const customersMap = new Map<
      string,
      typeof customer.$inferSelect & { contactPeople: InferSelectModel<typeof contactPerson>[] }
    >();

    result.forEach((row: CustomerRow) => {
      const existing =
        customersMap.get(row.customer.id) ?? { ...row.customer, contactPeople: [] as InferSelectModel<typeof contactPerson>[] };
      if (row.contactPerson) {
        existing.contactPeople.push(row.contactPerson);
      }
      customersMap.set(row.customer.id, existing);
    });

    console.log("[DEBUG] getAllCustomers - Processed customers:", JSON.stringify(Array.from(customersMap.values()), null, 2));

    return Array.from(customersMap.values());
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown database error in getAllCustomers";
    console.error("[ERROR] Error in getAllCustomers:", message, error);
    throw error;
  }
}

export async function updateCustomer(
  id: string,
  updatedFields: {
    abbreviation?: string;
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    category?: string;
    billingCode?: string;
    serviceManager?: string;
    businessEmail?: string;
    businessPhone?: string;
    sla?: boolean;
    contactPersons?: { name: string; email: string; phone: string; }[];
    customerInstructions?: Array<{type: 'text' | 'image', content: string}> | null; // Add this line
  }
) {
  type CustomerFieldsForUpdate = Omit<typeof updatedFields, 'contactPersons'>;
  const customerUpdateData: CustomerFieldsForUpdate = updatedFields;

  const result = await db
    .update(customer)
    .set(customerUpdateData)
    .where(eq(customer.id, id))
    .returning();
  const updatedCustomer = result[0];

  if (updatedCustomer && updatedFields.contactPersons !== undefined) {
    await db.delete(contactPerson).where(eq(contactPerson.customerId, id));

    if (updatedFields.contactPersons.length > 0) {
      const contactPersonsToInsert = updatedFields.contactPersons.map(cp => ({
        id: uuidv4(),
        customerId: updatedCustomer.id,
        name: cp.name,
        email: cp.email,
        phone: cp.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      try {
        await db.insert(contactPerson).values(contactPersonsToInsert);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: string }).code === "23505"
        ) {
          throw new Error("Ein Ansprechpartner mit dieser Kombination aus Name, E-Mail und Telefon existiert bereits für diesen Kunden.");
        }
        throw error;
      }
    }
  }
  
  const fullCustomer = await getCustomerById(id);
  return fullCustomer;
}

export async function deleteCustomer(id: string) {
  const result = await db.delete(customer).where(eq(customer.id, id)).returning();
  return result[0];
} 