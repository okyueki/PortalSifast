export type TicketType = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
};

export type TicketPriority = {
    id: number;
    name: string;
    level: number;
    color: string;
    response_hours: number | null;
    resolution_hours: number | null;
    is_active: boolean;
};

export type TicketStatus = {
    id: number;
    name: string;
    slug: string;
    color: string;
    order: number;
    is_closed: boolean;
    is_active: boolean;
};

export type TicketCategory = {
    id: number;
    name: string;
    dep_id: string;
    ticket_type_id: number | null;
    is_development: boolean;
    is_active: boolean;
    subcategories?: TicketSubcategory[];
};

export type TicketSubcategory = {
    id: number;
    name: string;
    ticket_category_id: number;
    is_active: boolean;
};

export type TicketUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    dep_id: string | null;
};

export type TicketComment = {
    id: number;
    ticket_id: number;
    user_id: number;
    body: string;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
    user: TicketUser;
};

export type TicketAttachment = {
    id: number;
    ticket_id: number;
    user_id: number;
    filename: string;
    path: string;
    mime_type: string | null;
    size: number | null;
    url: string;
    created_at: string;
    user: TicketUser;
};

export type TicketActivity = {
    id: number;
    ticket_id: number;
    user_id: number;
    action: string;
    old_value: string | null;
    new_value: string | null;
    description: string | null;
    created_at: string;
    action_label: string;
    user: TicketUser;
};

export type TicketCollaborator = {
    id: number;
    ticket_id: number;
    user_id: number;
    created_at: string;
    user: TicketUser;
};

export type TicketVendorCost = {
    id: number;
    ticket_id: number;
    vendor_name: string;
    estimated_cost: number | null;
    actual_cost: number | null;
    sparepart_notes: string | null;
    vendor_notes: string | null;
    work_date: string | null;
    created_at: string;
};

export type TicketSparepartItem = {
    id: number;
    ticket_id: number;
    nama_item: string;
    qty: number;
    harga_satuan: number;
    catatan: string | null;
    created_at: string;
};

export type TicketGroup = {
    id: number;
    name: string;
    dep_id: string;
};

export type TicketTag = {
    id: number;
    name: string;
    slug: string;
};

export type Ticket = {
    id: number;
    ticket_number: string;
    ticket_type_id: number;
    ticket_category_id: number | null;
    ticket_subcategory_id: number | null;
    ticket_priority_id: number;
    ticket_status_id: number;
    dep_id: string;
    requester_id: number;
    assignee_id: number | null;
    ticket_group_id: number | null;
    related_ticket_id: number | null;
    asset_no_inventaris: string | null;
    asset_id?: number | null; // deprecated
    title: string;
    description: string | null;
    first_response_at: string | null;
    resolved_at: string | null;
    closed_at: string | null;
    response_due_at: string | null;
    resolution_due_at: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    type: TicketType;
    category: TicketCategory | null;
    subcategory: TicketSubcategory | null;
    priority: TicketPriority;
    status: TicketStatus;
    requester: TicketUser;
    assignee: TicketUser | null;
    group: TicketGroup | null;
    related_ticket: Ticket | null;
    inventaris?: {
        no_inventaris: string;
        kode_barang: string;
        barang?: {nama_barang: string};
        ruang?: {nama_ruang: string};
    } | null;
    tags?: TicketTag[];
    comments?: TicketComment[];
    attachments?: TicketAttachment[];
    activities?: TicketActivity[];
    collaborators?: TicketCollaborator[];
    vendor_costs?: TicketVendorCost[];
    sparepart_items?: TicketSparepartItem[];
};

export type PaginatedTickets = {
    data: Ticket[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

export type TicketFilters = {
    status?: string;
    priority?: string;
    department?: string;
    assignee?: string;
    search?: string;
    tag?: string;
};
