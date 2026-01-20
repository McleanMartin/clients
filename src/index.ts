import { renderHtml } from "./renderHtml";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// API Routes
		if (path.startsWith("/api/")) {
			// GET /api/customers - Get all customers with company names
			if (path === "/api/customers" && method === "GET") {
				try {
					const stmt = env.DB.prepare(`
						SELECT 
							c.id,
							c.first_name,
							c.last_name,
							c.email,
							c.phone,
							c.company_id,
							co.name as company_name,
							c.created_at,
							c.updated_at
						FROM customers c
						LEFT JOIN companies co ON c.company_id = co.id
						ORDER BY c.id
					`);
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: {
							"content-type": "application/json",
						},
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to fetch customers" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// POST /api/customers - Create a new customer
			if (path === "/api/customers" && method === "POST") {
				try {
					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company_id?: number;
					};

					// Validate required fields
					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					// Insert customer
					const stmt = env.DB.prepare(`
						INSERT INTO customers (first_name, last_name, email, phone, company_id)
						VALUES (?, ?, ?, ?, ?)
					`).bind(
						body.first_name,
						body.last_name,
						body.email,
						body.phone || null,
						body.company_id || null
					);

					await stmt.run();

					// Get the created customer
					const getStmt = env.DB.prepare(`
						SELECT 
							c.id,
							c.first_name,
							c.last_name,
							c.email,
							c.phone,
							c.company_id,
							co.name as company_name,
							c.created_at,
							c.updated_at
						FROM customers c
						LEFT JOIN companies co ON c.company_id = co.id
						WHERE c.id = last_insert_rowid()
					`);
					const { results } = await getStmt.all();
					const customer = results[0];

					return new Response(JSON.stringify(customer), {
						status: 201,
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to create customer" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// PUT /api/customers/:id - Update a customer
			if (path.startsWith("/api/customers/") && method === "PUT") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid customer ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const body = await request.json() as {
						first_name: string;
						last_name: string;
						email: string;
						phone?: string;
						company_id?: number;
					};

					// Validate required fields
					if (!body.first_name || !body.last_name || !body.email) {
						return new Response(JSON.stringify({ error: "Missing required fields" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					// Update customer
					const stmt = env.DB.prepare(`
						UPDATE customers 
						SET first_name = ?, last_name = ?, email = ?, phone = ?, company_id = ?, updated_at = CURRENT_TIMESTAMP
						WHERE id = ?
					`).bind(
						body.first_name,
						body.last_name,
						body.email,
						body.phone || null,
						body.company_id || null,
						id
					);

					await stmt.run();

					// Get the updated customer
					const getStmt = env.DB.prepare(`
						SELECT 
							c.id,
							c.first_name,
							c.last_name,
							c.email,
							c.phone,
							c.company_id,
							co.name as company_name,
							c.created_at,
							c.updated_at
						FROM customers c
						LEFT JOIN companies co ON c.company_id = co.id
						WHERE c.id = ?
					`).bind(id);
					const { results } = await getStmt.all();
					const customer = results[0];

					if (!customer) {
						return new Response(JSON.stringify({ error: "Customer not found" }), {
							status: 404,
							headers: { "content-type": "application/json" },
						});
					}

					return new Response(JSON.stringify(customer), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to update customer" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// DELETE /api/customers/:id - Delete a customer
			if (path.startsWith("/api/customers/") && method === "DELETE") {
				try {
					const id = parseInt(path.split("/")[3]);
					if (isNaN(id)) {
						return new Response(JSON.stringify({ error: "Invalid customer ID" }), {
							status: 400,
							headers: { "content-type": "application/json" },
						});
					}

					const stmt = env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(id);
					await stmt.run();

					return new Response(JSON.stringify({ success: true }), {
						headers: { "content-type": "application/json" },
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to delete customer" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// GET /api/companies - Get all companies
			if (path === "/api/companies" && method === "GET") {
				try {
					const stmt = env.DB.prepare("SELECT * FROM companies ORDER BY name");
					const { results } = await stmt.all();
					return new Response(JSON.stringify(results), {
						headers: {
							"content-type": "application/json",
						},
					});
				} catch (error) {
					return new Response(JSON.stringify({ error: "Failed to fetch companies" }), {
						status: 500,
						headers: { "content-type": "application/json" },
					});
				}
			}

			// 404 for unknown API routes
			return new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}

		// Root path - render HTML
		if (path === "/") {
			return new Response(renderHtml(), {
				headers: {
					"content-type": "text/html",
				},
			});
		}

		// 404 for other routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
