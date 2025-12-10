"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, AlertTriangle, SquarePen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/ui/page-header"
import { useSystemDefinitions } from "@/lib/system-definitions"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { useSortableTable } from "@/hooks/use-sortable-table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

type ContactPerson = {
  name: string;
  email: string;
  phone: string;
};

// Define Customer type based on your Drizzle schema for customer
type Customer = {
  id: string;
  abbreviation: string;
  name: string;
  contactPersons: ContactPerson[]; // Array of contact persons
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  category?: string | null;
  billingCode?: string | null;
  serviceManager?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  sla?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type CustomerApiResponse = Customer & { contactPeople?: ContactPerson[] };

interface Filters {
  sla: boolean | null;
  category: string | null;
  serviceManager: string | null;
  billingCode: string | null;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { definitions, loading: definitionsLoading, error: definitionsError } = useSystemDefinitions();
  const billingCodes = (definitions.billingCodes || []) as string[];
  const technicians = (definitions.technicians || []) as string[];
  const [filters, setFilters] = useState<Filters>({
    sla: null,
    category: null,
    serviceManager: null,
    billingCode: null,
  });

  const columnVisibility = useMemo(() => {
    if (typeof window !== 'undefined') {
      const savedVisibility = localStorage.getItem('customerColumnVisibility');
      return savedVisibility ? JSON.parse(savedVisibility) : {
        abbreviation: true,
        name: true,
        category: true,
        billingCode: true,
        address: true,
        contactPersons: true,
        serviceManager: true,
        sla: true,
        businessPhone: true,
        businessEmail: true,
      };
    }
    return {
      abbreviation: true,
      name: true,
      category: true,
      billingCode: true,
      address: true,
      contactPersons: true,
      serviceManager: true,
      sla: true,
      businessPhone: true,
      businessEmail: true,
    };
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/customers");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CustomerApiResponse[] = await response.json();
        const mappedData: Customer[] = data.map(({ contactPeople, ...rest }) => ({
          ...rest,
          contactPersons: contactPeople ?? rest.contactPersons ?? [],
        }));
        setCustomers(mappedData);
      } catch (fetchError: unknown) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch customers";
        setError(message);
        console.error("Error fetching customers:", fetchError);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const sortedAndFilteredCustomers = useMemo(() => {
    let currentCustomers = [...customers];

    // Apply filters
    if (filters.sla !== null) {
      currentCustomers = currentCustomers.filter(c => c.sla === filters.sla);
    }
    if (filters.category) {
      currentCustomers = currentCustomers.filter(c => c.category === filters.category);
    }
    if (filters.serviceManager) {
      currentCustomers = currentCustomers.filter(c => c.serviceManager === filters.serviceManager);
    }
    if (filters.billingCode) {
      currentCustomers = currentCustomers.filter(c => c.billingCode === filters.billingCode);
    }

    // Apply search term
    currentCustomers = currentCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.postalCode && customer.postalCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.country && customer.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.category && customer.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.billingCode && customer.billingCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.serviceManager && customer.serviceManager.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.contactPersons && customer.contactPersons.some(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );

    return currentCustomers;
  }, [customers, searchTerm, filters]);

  // Sorting
  const { sortedData, sortConfig, requestSort } = useSortableTable(sortedAndFilteredCustomers, "name" as keyof Customer)

  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE) || 1;
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const paginatedCustomers = sortedData.slice(startIdx, endIdx);

  const navigateToCustomerDetail = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const resetFilters = () => {
    setFilters({ sla: null, category: null, serviceManager: null, billingCode: null });
  };

  return (
    <div className="h-full flex-1 flex-col space-y-6 overflow-x-hidden p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Kunden" },
        ]}
        className="mb-4"
      />

      <PageHeader
        title="Kunden"
        description="Verwalten Sie hier alle iTaurus Kunden und deren Details."
      // actions komplett entfernen, damit kein Dialog/Trigger mehr angeboten wird
      />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alle Kunden</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kunden suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtern nach</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>SLA</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => setFilters(f => ({ ...f, sla: true }))}>Ja</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setFilters(f => ({ ...f, sla: false }))}>Nein</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Kategorie</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {['A', 'B', 'C'].map(cat => (
                          <DropdownMenuItem key={cat} onSelect={() => setFilters(f => ({ ...f, category: cat }))}>
                            {cat}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Service Manager</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {technicians.map(tech => (
                          <DropdownMenuItem key={tech} onSelect={() => setFilters(f => ({ ...f, serviceManager: tech }))}>
                            {tech}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Abrechnungscode</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {billingCodes.map(code => (
                          <DropdownMenuItem key={code} onSelect={() => setFilters(f => ({ ...f, billingCode: code }))}>
                            {code}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={resetFilters}>
                    Filter zurücksetzen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || definitionsLoading) ? (
            <div className="flex justify-center items-center h-40">
              <LoadingSpinner />
            </div>
          ) : (error || definitionsError) ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-500">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p>Fehler beim Laden der Kunden: {error || definitionsError}</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <SquarePen className="h-12 w-12 mb-4" />
              <p>Keine Kunden gefunden.</p>
            </div>
          ) : (
            <Table className="min-w-[800px] ">
              <TableHeader>
                <TableRow className="border-b-2">
                  {columnVisibility.abbreviation && (
                    <SortableTableHead<Customer>
                      label="Kürzel"
                      sortKey="abbreviation"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={requestSort}
                      className="px-4 py-2 text-xs md:text-sm"
                    />
                  )}
                  {columnVisibility.name && (
                    <SortableTableHead<Customer>
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={requestSort}
                      className="px-4 py-2 text-xs md:text-sm"
                    />
                  )}
                  {columnVisibility.contactPersons && (
                    <TableHead className="px-4 py-2 text-xs md:text-sm">Ansprechpartner</TableHead>
                  )}
                  {columnVisibility.category && (
                    <SortableTableHead<Customer>
                      label="Kategorie"
                      sortKey="category"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={requestSort}
                      className="px-4 py-2 text-xs md:text-sm"
                    />
                  )}
                  {columnVisibility.billingCode && (
                    <SortableTableHead<Customer>
                      label="Abrechnungscode"
                      sortKey="billingCode"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={requestSort}
                      className="hidden md:table-cell px-4 py-2 text-xs md:text-sm"
                    />
                  )}
                  {columnVisibility.address && (
                    <TableHead className="hidden lg:table-cell px-4 py-2 text-xs md:text-sm">Adresse</TableHead>
                  )}
                  {columnVisibility.serviceManager && (
                    <SortableTableHead<Customer>
                      label="Service Manager"
                      sortKey="serviceManager"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={requestSort}
                      className="hidden md:table-cell px-4 py-2 text-xs md:text-sm"
                    />
                  )}
                  {columnVisibility.sla && (
                    <SortableTableHead<Customer>
                      label="SLA"
                      sortKey="sla"
                      currentSortKey={sortConfig.key}
                      currentDirection={sortConfig.direction}
                      onSort={requestSort}
                      className="hidden md:table-cell px-4 py-2 text-xs md:text-sm"
                    />
                  )}
                  {columnVisibility.businessPhone && (
                    <TableHead className="hidden md:table-cell px-4 py-2 text-xs md:text-sm">Firmen Telefon</TableHead>
                  )}
                  {columnVisibility.businessEmail && (
                    <TableHead className="hidden md:table-cell px-4 py-2 text-xs md:text-sm">Firmen E-Mail</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer" onClick={() => navigateToCustomerDetail(customer.id)}>
                    {columnVisibility.abbreviation && (
                      <TableCell className="px-4 py-3 text-xs md:text-sm break-words">{customer.abbreviation}</TableCell>
                    )}
                    {columnVisibility.name && (
                      <TableCell className="px-4 py-3 text-xs md:text-sm font-medium break-words">{customer.name}</TableCell>
                    )}
                    {columnVisibility.contactPersons && (
                      <TableCell className="px-4 py-3 text-xs md:text-sm break-words">
                        {customer.contactPersons && customer.contactPersons.length > 0
                          ? customer.contactPersons.map((person, idx) => (
                            <div key={idx}>{person.name}</div>
                          ))
                          : "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.category && (
                      <TableCell className="px-4 py-3 text-xs md:text-sm break-words">{customer.category || "N/A"}</TableCell>
                    )}
                    {columnVisibility.billingCode && (
                      <TableCell className="hidden md:table-cell px-4 py-3 text-xs md:text-sm break-words">
                        <Badge variant="outline">{customer.billingCode || "N/A"}</Badge>
                      </TableCell>
                    )}
                    {columnVisibility.address && (
                      <TableCell className="hidden lg:table-cell px-4 py-3 text-xs md:text-sm break-words">{`${customer.address || ""}${customer.address && (customer.postalCode || customer.city || customer.country) ? ", " : ""}${customer.postalCode || ""} ${customer.city || ""}${customer.city && customer.country ? ", " : ""}${customer.country || ""}`.trim() || "N/A"}</TableCell>
                    )}
                    {columnVisibility.serviceManager && (
                      <TableCell className="hidden md:table-cell px-4 py-3 text-xs md:text-sm break-words">{customer.serviceManager || "N/A"}</TableCell>
                    )}
                    {columnVisibility.sla && (
                      <TableCell className="hidden md:table-cell px-4 py-3 text-xs md:text-sm break-words">{customer.sla ? <Badge>Ja</Badge> : <Badge variant="outline">Nein</Badge>}</TableCell>
                    )}
                    {columnVisibility.businessPhone && (
                      <TableCell className="hidden md:table-cell px-4 py-3 text-xs md:text-sm break-words">{customer.businessPhone || "N/A"}</TableCell>
                    )}
                    {columnVisibility.businessEmail && (
                      <TableCell className="hidden md:table-cell px-4 py-3 text-xs md:text-sm break-words">{customer.businessEmail || "N/A"}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Zurück</Button>
        <span className="font-medium text-sm">Seite {page} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Weiter</Button>
      </div>

    </div>
  );
} 