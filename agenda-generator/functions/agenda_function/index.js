const catalyst = require('zcatalyst-sdk-node');
const visitController = require('./controller/visitController');
const speakerController = require('./controller/speakerController');

/**
 * 
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 */
module.exports = async (req, res) => {
	const catalystApp = catalyst.initialize(req);
	const url = req.url;
	const method = req.method;

	// CORS Headers
	res.setHeader('Access-Control-Allow-Origin', '*'); 
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

	if (method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

		// Route: /visits
		if (pathname === '/visits') {
			if (method === 'POST') {
				let body = '';
				req.on('data', chunk => { body += chunk.toString(); });
				req.on('end', async () => {
					try {
						const data = JSON.parse(body);
						await visitController.createVisit(catalystApp, data, res, req);
					} catch (err) {
						res.writeHead(400, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ status: 'error', message: err.message }));
					}
				});
			} else if (method === 'GET') {
				await visitController.getVisits(catalystApp, res, req);
			}
		} 
		// Route: /visits/:id or /visit/:id
		else if ((pathname.startsWith('/visits/') || pathname.startsWith('/visit/')) && (method === 'PUT' || method === 'GET' || method === 'DELETE')) {
			const id = pathname.split('/')[2];
			
			if (!id || id === 'null' || id === 'undefined') {
				res.writeHead(400, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ status: 'error', message: 'Invalid visit ID provided' }));
				return;
			}

			if (method === 'GET') {
				await visitController.getVisitById(catalystApp, id, res, req);
			} else if (method === 'DELETE') {
				await visitController.deleteVisit(catalystApp, id, res, req);
			} else if (method === 'PUT') {
				let body = '';
				req.on('data', chunk => { body += chunk.toString(); });
				req.on('end', async () => {
					try {
						const data = JSON.parse(body);
						await visitController.updateVisit(catalystApp, id, data, res, req);
					} catch (err) {
						res.writeHead(400, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ status: 'error', message: err.message }));
					}
				});
			}
		} 
		// Route: /speakers
		else if (pathname === '/speakers') {
			if (method === 'GET') {
				await speakerController.getSpeakers(catalystApp, res, req);
			} else if (method === 'POST') {
				await speakerController.createSpeaker(catalystApp, req, res);
			}
		}
		// Route: /speakers/:id
		else if (pathname.startsWith('/speakers/')) {
			const id = pathname.split('/')[2];
			if (method === 'PUT') {
				let body = '';
				req.on('data', chunk => { body += chunk.toString(); });
				req.on('end', async () => {
					try {
						const data = JSON.parse(body);
						await speakerController.updateSpeaker(catalystApp, id, data, res, req);
					} catch (err) {
						res.writeHead(400, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ status: 'error', message: err.message }));
					}
				});
			} else if (method === 'DELETE') {
				await speakerController.deleteSpeaker(catalystApp, id, res, req);
			}
		}
		// Route: /speaker/login
		else if (pathname === '/speaker/login' && method === 'POST') {
			let body = '';
			req.on('data', chunk => { body += chunk.toString(); });
			req.on('end', async () => {
				try {
					const data = JSON.parse(body);
					await speakerController.loginSpeaker(catalystApp, data, res);
				} catch (err) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ status: 'error', message: err.message }));
				}
			});
		}
		// Route: /speaker/assets
		else if (pathname === '/speaker/assets' && method === 'GET') {
			const visitId = parsedUrl.searchParams.get('visitId');
			if (!visitId) {
				res.writeHead(400, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify({ status: 'error', message: 'visitId is required' }));
			}
			await speakerController.getSpeakerAssets(catalystApp, visitId, res);
		}
		// Route: /speaker/upload-asset
		else if (pathname === '/speaker/upload-asset' && method === 'POST') {
			await speakerController.uploadAsset(catalystApp, req, res);
		}
		else {
			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'error', message: 'Path not found' }));
		}
	} catch (err) {
		console.error('Core function error:', err);
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }));
	}
};

