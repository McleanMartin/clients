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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .toolbar {
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-danger {
            background: #e74c3c;
            color: white;
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .btn-edit {
            background: #3498db;
            color: white;
        }

        .btn-edit:hover {
            background: #2980b9;
        }

        .btn-secondary {
            background: #95a5a6;
            color: white;
        }

        .btn-secondary:hover {
            background: #7f8c8d;
        }

        .table-container {
            overflow-x: auto;
            padding: 20px 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        thead {
            background: #f8f9fa;
        }

        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #555;
            border-bottom: 2px solid #e0e0e0;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
        }

        tbody tr:hover {
            background: #f8f9fa;
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
            color: #999;
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
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
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
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
        }

        .modal-header h2 {
            font-size: 24px;
            color: #333;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-btn:hover {
            color: #333;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #555;
        }

        .form-group label .required {
            color: #e74c3c;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }

        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 25px;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #999;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }

            .toolbar {
                flex-direction: column;
                gap: 15px;
                align-items: stretch;
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
            <h1>🏢 CRM - Customer Management</h1>
            <p>Manage your customer relationships</p>
        </div>

        <div class="toolbar">
            <button class="btn btn-primary" onclick="openAddModal()">+ Add Customer</button>
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
                companies = await response.json();
                const select = document.getElementById('companyId');
                select.innerHTML = '<option value="">None</option>';
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = escapeHtml(company.name);
                    select.appendChild(option);
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
                const customers = await response.json();

                loading.style.display = 'none';

                if (customers.length === 0) {
                    table.style.display = 'none';
                    emptyState.style.display = 'block';
                } else {
                    table.style.display = 'table';
                    emptyState.style.display = 'none';
                    tbody.innerHTML = customers.map(customer => \`
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
                }
            } catch (error) {
                loading.style.display = 'none';
                console.error('Failed to load customers:', error);
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #e74c3c;">Failed to load customers. Please refresh the page.</td></tr>';
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
