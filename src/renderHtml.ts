export function renderHtml() {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CRM - Customer Management</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #ffffff;
            min-height: 100vh;
            padding: 20px;
            color: #000000;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #000000;
            overflow: hidden;
        }

        .header {
            background: #000000;
            color: #ffffff;
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #000000;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .header p {
            color: #cccccc;
        }

        .toolbar {
            padding: 20px 30px;
            background: #ffffff;
            border-bottom: 1px solid #000000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .toolbar-left {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }

        .toolbar-right {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .search-filter-container {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        .search-input,
        .filter-select {
            padding: 8px 12px;
            border: 1px solid #000000;
            font-size: 14px;
            background: #ffffff;
            color: #000000;
        }

        .search-input {
            min-width: 250px;
        }

        .search-input:focus,
        .filter-select:focus {
            outline: none;
            border: 2px solid #000000;
        }

        .filter-select {
            min-width: 150px;
        }

        .btn {
            padding: 10px 20px;
            border: 1px solid #000000;
            border-radius: 0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            background: #ffffff;
            color: #000000;
        }

        .btn:hover {
            background: #000000;
            color: #ffffff;
        }

        .btn-primary {
            background: #000000;
            color: #ffffff;
        }

        .btn-primary:hover {
            background: #333333;
        }

        .btn-danger {
            background: #ffffff;
            color: #000000;
            border-color: #000000;
        }

        .btn-danger:hover {
            background: #000000;
            color: #ffffff;
        }

        .btn-edit {
            background: #ffffff;
            color: #000000;
            border-color: #000000;
        }

        .btn-edit:hover {
            background: #000000;
            color: #ffffff;
        }

        .btn-secondary {
            background: #ffffff;
            color: #000000;
            border-color: #000000;
        }

        .btn-secondary:hover {
            background: #000000;
            color: #ffffff;
        }

        .table-container {
            overflow-x: auto;
            padding: 20px 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
        }

        thead {
            background: #000000;
            color: #ffffff;
        }

        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #000000;
        }

        td {
            padding: 15px;
            border: 1px solid #cccccc;
        }

        tbody tr:hover {
            background: #f5f5f5;
        }

        tbody tr:nth-child(even) {
            background: #fafafa;
        }

        tbody tr:nth-child(even):hover {
            background: #f0f0f0;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .actions .btn {
            padding: 6px 12px;
            font-size: 12px;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666666;
        }

        .empty-state p {
            font-size: 18px;
            margin-top: 10px;
        }

        /* Modal Styles */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s;
        }

        .modal-overlay.active {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal {
            background: #ffffff;
            border: 2px solid #000000;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 0 0 4px #ffffff;
            animation: slideUp 0.3s;
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #000000;
        }

        .modal-header h2 {
            font-size: 24px;
            color: #000000;
            font-weight: 600;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #000000;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }

        .close-btn:hover {
            background: #000000;
            color: #ffffff;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #000000;
        }

        .form-group label .required {
            color: #000000;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #000000;
            border-radius: 0;
            font-size: 14px;
            background: #ffffff;
            color: #000000;
            transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border: 2px solid #000000;
        }

        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #cccccc;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666666;
        }

        .results-count {
            color: #666666;
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }

            .toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .toolbar-left,
            .toolbar-right {
                width: 100%;
            }

            .search-filter-container {
                width: 100%;
            }

            .search-input {
                flex: 1;
                min-width: 0;
            }

            .table-container {
                padding: 10px;
            }

            table {
                font-size: 12px;
            }

            th, td {
                padding: 10px 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CRM - Customer Management</h1>
            <p>Manage your customer relationships</p>
        </div>

        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-filter-container">
                    <input 
                        type="text" 
                        id="searchInput" 
                        class="search-input" 
                        placeholder="Search customers..." 
                        oninput="filterTable()"
                    />
                    <select id="companyFilter" class="filter-select" onchange="filterTable()">
                        <option value="">All Companies</option>
                    </select>
                </div>
                <span id="resultsCount" class="results-count"></span>
            </div>
            <div class="toolbar-right">
                <button class="btn btn-primary" onclick="openAddModal()">+ Add Customer</button>
            </div>
        </div>

        <div class="table-container">
            <div id="loading" class="loading">Loading customers...</div>
            <table id="customersTable" style="display: none;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="customersTableBody">
                </tbody>
            </table>
            <div id="emptyState" class="empty-state" style="display: none;">
                <p>No customers found. Click "+ Add Customer" to get started.</p>
            </div>
            <div id="noResultsState" class="empty-state" style="display: none;">
                <p>No customers match your search criteria.</p>
            </div>
        </div>
    </div>

    <!-- Add/Edit Modal -->
    <div id="modalOverlay" class="modal-overlay" onclick="if(event.target === this) closeModal()">
        <div class="modal">
            <div class="modal-header">
                <h2 id="modalTitle">Add Customer</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <form id="customerForm" onsubmit="saveCustomer(event)">
                <input type="hidden" id="customerId" />
                <div class="form-group">
                    <label for="firstName">First Name <span class="required">*</span></label>
                    <input type="text" id="firstName" required />
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name <span class="required">*</span></label>
                    <input type="text" id="lastName" required />
                </div>
                <div class="form-group">
                    <label for="email">Email <span class="required">*</span></label>
                    <input type="email" id="email" required />
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="text" id="phone" />
                </div>
                <div class="form-group">
                    <label for="companyId">Company</label>
                    <select id="companyId">
                        <option value="">None</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let companies = [];
        let allCustomers = [];
        let editingCustomerId = null;

        // Utility functions
        function escapeHtml(text) {
            if (text == null) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function escapeJs(text) {
            if (text == null) return '';
            return String(text)
                .replace(/\\\\/g, '\\\\\\\\')
                .replace(/'/g, "\\\\'")
                .replace(/"/g, '\\\\"')
                .replace(/\\n/g, '\\\\n')
                .replace(/\\r/g, '\\\\r')
                .replace(/\\t/g, '\\\\t');
        }

        // Load companies for dropdown
        async function loadCompanies() {
            try {
                const response = await fetch('/api/companies');
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('Failed to load companies:', errorData.error || errorData.details);
                    return;
                }
                
                companies = await response.json();
                const select = document.getElementById('companyId');
                const filterSelect = document.getElementById('companyFilter');
                
                select.innerHTML = '<option value="">None</option>';
                filterSelect.innerHTML = '<option value="">All Companies</option>';
                
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = escapeHtml(company.name);
                    select.appendChild(option.cloneNode(true));
                    filterSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Failed to load companies:', error);
            }
        }

        // Load customers
        async function loadCustomers() {
            const loading = document.getElementById('loading');
            const table = document.getElementById('customersTable');
            const tbody = document.getElementById('customersTableBody');
            const emptyState = document.getElementById('emptyState');

            try {
                const response = await fetch('/api/customers');
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || errorData.details || \`HTTP \${response.status}\`);
                }
                
                allCustomers = await response.json();

                loading.style.display = 'none';

                if (allCustomers.length === 0) {
                    table.style.display = 'none';
                    emptyState.style.display = 'block';
                    document.getElementById('noResultsState').style.display = 'none';
                    document.getElementById('resultsCount').textContent = '';
                } else {
                    filterTable();
                }
            } catch (error) {
                loading.style.display = 'none';
                console.error('Failed to load customers:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                tbody.innerHTML = \`<tr><td colspan="7" style="text-align: center; color: #000000; padding: 20px;">
                    <strong>Failed to load customers</strong><br>
                    <small style="color: #666666;">\${escapeHtml(errorMessage)}</small><br>
                    <small style="color: #666666; margin-top: 10px; display: block;">
                        Make sure the database migration has been run: <code>npm run seedLocalD1</code>
                    </small>
                </td></tr>\`;
                table.style.display = 'table';
            }
        }

        // Filter and search table
        function filterTable() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const companyFilter = document.getElementById('companyFilter').value;
            const table = document.getElementById('customersTable');
            const tbody = document.getElementById('customersTableBody');
            const emptyState = document.getElementById('emptyState');
            const noResultsState = document.getElementById('noResultsState');
            const resultsCount = document.getElementById('resultsCount');

            let filteredCustomers = allCustomers.filter(customer => {
                // Search filter
                const matchesSearch = !searchTerm || 
                    customer.first_name.toLowerCase().includes(searchTerm) ||
                    customer.last_name.toLowerCase().includes(searchTerm) ||
                    customer.email.toLowerCase().includes(searchTerm) ||
                    (customer.phone && customer.phone.toLowerCase().includes(searchTerm)) ||
                    (customer.company_name && customer.company_name.toLowerCase().includes(searchTerm));

                // Company filter
                const matchesCompany = !companyFilter || 
                    (companyFilter && customer.company_id && customer.company_id.toString() === companyFilter);

                return matchesSearch && matchesCompany;
            });

            if (allCustomers.length === 0) {
                table.style.display = 'none';
                emptyState.style.display = 'block';
                noResultsState.style.display = 'none';
                resultsCount.textContent = '';
            } else if (filteredCustomers.length === 0) {
                table.style.display = 'none';
                emptyState.style.display = 'none';
                noResultsState.style.display = 'block';
                resultsCount.textContent = '';
            } else {
                table.style.display = 'table';
                emptyState.style.display = 'none';
                noResultsState.style.display = 'none';
                tbody.innerHTML = filteredCustomers.map(customer => \`
                    <tr>
                        <td>\${escapeHtml(customer.id)}</td>
                        <td>\${escapeHtml(customer.first_name)}</td>
                        <td>\${escapeHtml(customer.last_name)}</td>
                        <td>\${escapeHtml(customer.email)}</td>
                        <td>\${escapeHtml(customer.phone || '-')}</td>
                        <td>\${escapeHtml(customer.company_name || '-')}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-edit" onclick="editCustomer(\${customer.id}, '\${escapeJs(customer.first_name)}', '\${escapeJs(customer.last_name)}', '\${escapeJs(customer.email)}', '\${escapeJs(customer.phone || '')}', \${customer.company_id || 'null'})">Edit</button>
                                <button class="btn btn-danger" onclick="deleteCustomer(\${customer.id})">Delete</button>
                            </div>
                        </td>
                    </tr>
                \`).join('');
                
                // Update results count
                if (searchTerm || companyFilter) {
                    resultsCount.textContent = \`Showing \${filteredCustomers.length} of \${allCustomers.length} customers\`;
                } else {
                    resultsCount.textContent = \`\${allCustomers.length} customer\${allCustomers.length !== 1 ? 's' : ''}\`;
                }
            }
        }

        // Modal functions
        function openAddModal() {
            editingCustomerId = null;
            document.getElementById('modalTitle').textContent = 'Add Customer';
            document.getElementById('customerForm').reset();
            document.getElementById('customerId').value = '';
            document.getElementById('companyId').value = '';
            document.getElementById('modalOverlay').classList.add('active');
        }

        function editCustomer(id, firstName, lastName, email, phone, companyId) {
            editingCustomerId = id;
            document.getElementById('modalTitle').textContent = 'Edit Customer';
            document.getElementById('customerId').value = id;
            document.getElementById('firstName').value = firstName;
            document.getElementById('lastName').value = lastName;
            document.getElementById('email').value = email;
            document.getElementById('phone').value = phone || '';
            document.getElementById('companyId').value = companyId || '';
            document.getElementById('modalOverlay').classList.add('active');
        }

        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
            editingCustomerId = null;
        }

        // Save customer (add or update)
        async function saveCustomer(event) {
            event.preventDefault();

            const formData = {
                first_name: document.getElementById('firstName').value.trim(),
                last_name: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim() || null,
                company_id: document.getElementById('companyId').value ? parseInt(document.getElementById('companyId').value) : null
            };

            try {
                const url = editingCustomerId 
                    ? \`/api/customers/\${editingCustomerId}\`
                    : '/api/customers';
                
                const method = editingCustomerId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to save customer');
                    return;
                }

                closeModal();
                await loadCustomers();
            } catch (error) {
                console.error('Failed to save customer:', error);
                alert('Failed to save customer. Please try again.');
            }
        }

        // Delete customer
        async function deleteCustomer(id) {
            if (!confirm('Are you sure you want to delete this customer?')) {
                return;
            }

            try {
                const response = await fetch(\`/api/customers/\${id}\`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to delete customer');
                    return;
                }

                await loadCustomers();
            } catch (error) {
                console.error('Failed to delete customer:', error);
                alert('Failed to delete customer. Please try again.');
            }
        }

        // Initialize on page load
        async function init() {
            await loadCompanies();
            await loadCustomers();
        }

        init();
    </script>
</body>
</html>
`;
}
