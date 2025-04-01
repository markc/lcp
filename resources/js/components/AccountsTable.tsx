import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { rankItem } from '@tanstack/match-sorter-utils';
import {
    Column,
    ColumnFiltersState,
    createColumnHelper,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    Table,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    Download,
    Edit as EditIcon,
    Eye as EyeIcon,
    Filter as FilterIcon,
    Search,
    ToggleRight as SwitchIcon,
    Trash as TrashIcon,
} from 'lucide-react';
import { useState } from 'react';

// Extend TableMeta to include roles
declare module '@tanstack/react-table' {
    interface TableMeta {
        roles?: Record<number, string>;
    }
}

interface Account {
    id: number;
    login: string;
    fname: string;
    lname: string;
    altemail: string | null;
    acl: number;
    grp: number;
    created_at: string;
    updated_at: string;
}

interface AccountsTableProps {
    accounts: Account[];
    roles: Record<number, string>;
    onDelete: (id: number, login: string) => void;
    onSwitch: (id: number, login: string) => void;
    onEdit: (account: Account) => void;
}

// Define a fuzzy filter function
const fuzzyFilter: FilterFn<Account> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the ranking info
    addMeta({
        itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
};

// Function to export table data to CSV
function exportToCSV(table: Table<Account>, roles: Record<number, string>) {
    // Get visible columns
    const visibleColumns = table.getAllColumns().filter((column) => column.getIsVisible());

    // Create CSV header
    const headers = visibleColumns
        .map((column) => {
            // Map internal column IDs to user-friendly headers
            const headerMap: Record<string, string> = {
                login: 'Email',
                name: 'Name',
                altemail: 'Alt Email',
                acl: 'Role',
            };
            return headerMap[column.id] || column.id;
        })
        .filter((header) => header !== 'id' && header !== 'Actions');

    // Get selected or all rows
    const rows = table.getSelectedRowModel().rows.length > 0 ? table.getSelectedRowModel().rows : table.getRowModel().rows;

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map((row) => {
            return visibleColumns
                .map((column) => {
                    // Skip Actions column
                    if (column.id === 'id') return null;

                    // Format role values
                    if (column.id === 'acl') {
                        return `"${roles[row.original.acl]}"`;
                    }

                    // Handle special case for name
                    if (column.id === 'name') {
                        return `"${row.original.fname} ${row.original.lname}"`;
                    }

                    // Get cell value
                    const value = column.accessorFn ? column.accessorFn(row.original, 0) : row.original[column.id as keyof Account];

                    // Quote strings
                    return typeof value === 'string' ? `"${value}"` : value;
                })
                .filter(Boolean) // Remove null values
                .join(',');
        }),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Column Filter component
function ColumnFilter({ column, table }: { column: Column<Account, unknown>; table: Table<Account> }) {
    const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);

    const columnFilterValue = column.getFilterValue();

    const uniqueValues = column.id === 'acl' ? Object.keys(table.options.meta?.roles || {}).map(Number) : null;

    return typeof firstValue === 'number' || column.id === 'acl' ? (
        <div className="px-1 py-2">
            <div className="flex space-x-2">
                {uniqueValues && column.id === 'acl' ? (
                    <Select
                        value={(columnFilterValue as string) || ''}
                        onValueChange={(value) => column.setFilterValue(value !== '' ? Number(value) : undefined)}
                    >
                        <SelectTrigger className="h-8 min-w-[70px] text-xs">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All</SelectItem>
                            {Object.entries(table.options.meta?.roles || {}).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                    {value as string}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        type="number"
                        value={(columnFilterValue as [number, number])?.[0] ?? ''}
                        onChange={(e) =>
                            column.setFilterValue((old: [number, number]) => [e.target.value ? parseInt(e.target.value) : undefined, old?.[1]])
                        }
                        placeholder="Min"
                        className="h-8 min-w-[70px] text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
                    />
                )}
            </div>
        </div>
    ) : (
        <div className="px-1 py-2">
            <Input
                type="text"
                value={(columnFilterValue ?? '') as string}
                onChange={(e) => column.setFilterValue(e.target.value)}
                placeholder="Filter..."
                className="h-6 min-w-[120px] text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
            />
        </div>
    );
}

export function AccountsTable({ accounts, roles, onDelete, onSwitch, onEdit }: AccountsTableProps) {
    // State for table features
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const columnHelper = createColumnHelper<Account>();

    const columns = [
        // Row selection column
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        }),
        // Data columns
        columnHelper.accessor('login', {
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="px-0 font-medium text-gray-500 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 dark:hover:bg-gray-800">
                                <FilterIcon className="h-3 w-3 dark:text-gray-300" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-60 p-2 dark:border-gray-700 dark:bg-gray-800">
                            <ColumnFilter column={column} table={table} />
                        </PopoverContent>
                    </Popover>
                </div>
            ),
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor((row) => `${row.fname} ${row.lname}`, {
            id: 'name',
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="px-0 font-medium text-gray-500 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 dark:hover:bg-gray-800">
                                <FilterIcon className="h-3 w-3 dark:text-gray-300" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-60 p-2 dark:border-gray-700 dark:bg-gray-800">
                            <ColumnFilter column={column} table={table} />
                        </PopoverContent>
                    </Popover>
                </div>
            ),
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('altemail', {
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="px-0 font-medium text-gray-500 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Alt Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 dark:hover:bg-gray-800">
                                <FilterIcon className="h-3 w-3 dark:text-gray-300" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-60 p-2 dark:border-gray-700 dark:bg-gray-800">
                            <ColumnFilter column={column} table={table} />
                        </PopoverContent>
                    </Popover>
                </div>
            ),
            cell: (info) => info.getValue() || '',
        }),
        columnHelper.accessor('acl', {
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="px-0 font-medium text-gray-500 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Role
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 dark:hover:bg-gray-800">
                                <FilterIcon className="h-3 w-3 dark:text-gray-300" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-60 p-2 dark:border-gray-700 dark:bg-gray-800">
                            <ColumnFilter column={column} table={table} />
                        </PopoverContent>
                    </Popover>
                </div>
            ),
            cell: (info) => roles[info.getValue()],
            sortingFn: (rowA, rowB) => {
                // Sort by role name, not by acl number
                return roles[rowA.original.acl].localeCompare(roles[rowB.original.acl]);
            },
        }),
        columnHelper.accessor('id', {
            header: 'Actions',
            cell: (info) => {
                const account = info.row.original;
                return (
                    <div className="flex space-x-2">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onEdit(account)}
                            className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onSwitch(account.id, account.login)}
                            className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <SwitchIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => onDelete(account.id, account.login)}
                            className="dark:hover:bg-red-800"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: accounts,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
            columnVisibility,
        },
        meta: {
            roles, // Pass roles to be used in filters
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
    });

    return (
        <div className="w-full space-y-4">
            {/* Table tools */}
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                {/* Left side: Page size selector and Global search */}
                <div className="flex items-center gap-4">
                    {/* Page size selector */}
                    <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(value) => table.setPageSize(Number(value))}>
                        <SelectTrigger className="h-9 w-16 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                            <SelectGroup>
                                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={pageSize.toString()} className="dark:text-gray-300 dark:focus:bg-gray-700">
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <div className="relative w-64">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Input
                            placeholder="Search all columns..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-8 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
                        />
                    </div>
                    <div className="flex items-center space-x-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} records
                        </p>
                    </div>
                </div>

                {/* Table actions */}
                <div className="flex flex-wrap gap-2">
                    {/* Column visibility */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-9 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:border-gray-700 dark:bg-gray-800">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    // Map internal column IDs to user-friendly names
                                    const columnNames: Record<string, string> = {
                                        login: 'Email',
                                        name: 'Name',
                                        altemail: 'Alt Email',
                                        acl: 'Role',
                                        id: 'Actions',
                                    };

                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize dark:text-gray-300"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {columnNames[column.id] || column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Row selection actions */}
                    {table.getSelectedRowModel().rows.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setRowSelection({})} 
                                className="h-9 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Clear Selection ({table.getSelectedRowModel().rows.length})
                            </Button>
                        </div>
                    )}

                    {/* Export */}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportToCSV(table, roles)} 
                        className="h-9 font-normal dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900">
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-3 py-2 dark:text-gray-300">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-16 px-3 py-2 text-center dark:text-gray-300">
                                    No results found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length,
                    )}{' '}
                    of {table.getFilteredRowModel().rows.length} results
                </div>
                <div className="flex items-center">
                    {/* Page navigation */}
                    <div className="flex items-center rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <button
                            onClick={() => table.getCanPreviousPage() && table.firstPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:disabled:opacity-30"
                        >
                            «
                        </button>
                        <button
                            onClick={() => table.getCanPreviousPage() && table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:disabled:opacity-30"
                        >
                            ‹
                        </button>

                        {/* Page number buttons */}
                        {Array.from({ length: Math.min(table.getPageCount(), 6) }, (_, i) => {
                            // Calculate which page numbers to show
                            const currentPage = table.getState().pagination.pageIndex;
                            let pageIndex;

                            if (table.getPageCount() <= 6) {
                                // If we have 6 or fewer pages, show all page numbers
                                pageIndex = i;
                            } else if (currentPage < 3) {
                                // If we're on pages 0, 1, or 2, show pages 0-5
                                pageIndex = i;
                            } else if (currentPage > table.getPageCount() - 4) {
                                // If we're on the last 3 pages, show the last 6 pages
                                pageIndex = table.getPageCount() - 6 + i;
                            } else {
                                // Otherwise show current page and 2 pages on each side
                                pageIndex = currentPage - 2 + i;
                            }

                            const isActive = pageIndex === currentPage;

                            return (
                                <button
                                    key={pageIndex}
                                    onClick={() => table.setPageIndex(pageIndex)}
                                    className={`px-4 py-2 text-sm ${
                                        isActive 
                                            ? 'bg-gray-600 text-white dark:bg-gray-600 dark:text-white' 
                                            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {pageIndex + 1}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => table.getCanNextPage() && table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:disabled:opacity-30"
                        >
                            ›
                        </button>
                        <button
                            onClick={() => table.getCanNextPage() && table.lastPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:disabled:opacity-30"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
