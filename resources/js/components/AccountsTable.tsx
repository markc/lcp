import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
// Popover removed
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
import { useState, useEffect } from 'react';

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
    onDeleteSelected: (ids: number[]) => void;
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

// Column Filter component removed

export function AccountsTable({ accounts, roles, onDelete, onDeleteSelected, onSwitch, onEdit }: AccountsTableProps) {
    // State for table features
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [searchColumn, setSearchColumn] = useState<string>('all');
    const [searchValue, setSearchValue] = useState<string>('');
    
    // Reset row selection when the data changes
    useEffect(() => {
        setRowSelection({});
    }, [accounts]);
    
    // Apply appropriate filter when search column or value changes
    useEffect(() => {
        if (searchColumn === 'all') {
            setGlobalFilter(searchValue);
            setColumnFilters([]);
        } else if (searchValue) {
            setGlobalFilter('');
            setColumnFilters([
                { id: searchColumn, value: searchValue }
            ]);
        } else {
            setGlobalFilter('');
            setColumnFilters([]);
        }
    }, [searchColumn, searchValue]);

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
                        className="px-0 font-medium text-stone-500 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
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
                        className="px-0 font-medium text-stone-500 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
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
                        className="px-0 font-medium text-stone-500 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                        Alt Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
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
                        className="px-0 font-medium text-stone-500 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                        Role
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
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
                            className="dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                        >
                            <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onSwitch(account.id, account.login)}
                            className="dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
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
                        <SelectTrigger className="h-9 w-16 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:border-stone-700 dark:bg-stone-800">
                            <SelectGroup>
                                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={pageSize.toString()} className="dark:text-stone-300 dark:focus:bg-stone-700">
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 font-normal dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700">
                                    <FilterIcon className="mr-2 h-4 w-4" />
                                    {searchColumn === 'all' 
                                        ? 'All Columns' 
                                        : searchColumn === 'login' 
                                            ? 'Email' 
                                            : searchColumn === 'name' 
                                                ? 'Name' 
                                                : searchColumn === 'altemail' 
                                                    ? 'Alt Email'
                                                    : 'Role'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="dark:border-stone-700 dark:bg-stone-800">
                                <DropdownMenuCheckboxItem
                                    checked={searchColumn === 'all'}
                                    onCheckedChange={() => setSearchColumn('all')}
                                    className="capitalize dark:text-stone-300"
                                >
                                    All Columns
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={searchColumn === 'login'}
                                    onCheckedChange={() => setSearchColumn('login')}
                                    className="capitalize dark:text-stone-300"
                                >
                                    Email
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={searchColumn === 'name'}
                                    onCheckedChange={() => setSearchColumn('name')}
                                    className="capitalize dark:text-stone-300"
                                >
                                    Name
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={searchColumn === 'altemail'}
                                    onCheckedChange={() => setSearchColumn('altemail')}
                                    className="capitalize dark:text-stone-300"
                                >
                                    Alt Email
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={searchColumn === 'acl'}
                                    onCheckedChange={() => setSearchColumn('acl')}
                                    className="capitalize dark:text-stone-300"
                                >
                                    Role
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="relative w-64">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-stone-500 dark:text-stone-400" />
                            <Input
                                placeholder={searchColumn === 'all' ? "Search all columns..." : `Search by ${searchColumn === 'login' ? 'email' : searchColumn}...`}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-8 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:placeholder-stone-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} records
                        </p>
                    </div>
                </div>

                {/* Table actions */}
                <div className="flex flex-wrap gap-2">
                    {/* Column visibility */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-9 font-normal dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700">
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:border-stone-700 dark:bg-stone-800">
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
                                            className="capitalize dark:text-stone-300"
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
                                className="h-9 font-normal dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                            >
                                Clear Selection ({table.getSelectedRowModel().rows.length})
                            </Button>
                            <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
                                    onDeleteSelected(selectedIds);
                                }} 
                                className="h-9 font-normal"
                            >
                                Delete Selected ({table.getSelectedRowModel().rows.length})
                            </Button>
                        </div>
                    )}

                    {/* Export */}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportToCSV(table, roles)} 
                        className="h-9 font-normal dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-stone-200 dark:border-stone-700 overflow-hidden">
                <table className="w-full">
                    <thead className="border-b border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-950">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="px-3 py-2 text-left font-medium text-stone-500 dark:text-stone-300">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white dark:bg-stone-900">
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="border-b border-stone-200 dark:border-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-3 py-2 dark:text-stone-300">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-16 px-3 py-2 text-center dark:text-stone-300">
                                    No results found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex-1 text-sm text-stone-500 dark:text-stone-400">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length,
                    )}{' '}
                    of {table.getFilteredRowModel().rows.length} results
                </div>
                <div className="flex items-center">
                    {/* Page navigation */}
                    <div className="flex items-center rounded-md border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
                        <button
                            onClick={() => table.getCanPreviousPage() && table.firstPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-700 dark:disabled:opacity-30"
                        >
                            «
                        </button>
                        <button
                            onClick={() => table.getCanPreviousPage() && table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-700 dark:disabled:opacity-30"
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
                                            ? 'bg-stone-600 text-white dark:bg-stone-600 dark:text-white' 
                                            : 'text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700'
                                    }`}
                                >
                                    {pageIndex + 1}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => table.getCanNextPage() && table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-700 dark:disabled:opacity-30"
                        >
                            ›
                        </button>
                        <button
                            onClick={() => table.getCanNextPage() && table.lastPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-700 dark:disabled:opacity-30"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
