module.exports = function(req, res, next) {
	let token;
	//Check if authorization header is present
	if(req.headers && req.headers.authorization) {
		//authorization header is present
		const parts = req.headers.authorization.split(' ');
		if(parts.length === 2) {
			const scheme = parts[0];
			const credentials = parts[1];

			if(/^Bearer$/i.test(scheme)) {
				token = credentials;
			}
		} else {
			return res.json(401, {err: 'Format is Authorization: Bearer [token]'});
		}
	} else {
		//authorization header is not present
		return res.json(401, {err: 'No Authorization header was found'});
	}
	jwToken.verify(token, function(err, decoded) {
		if(err) {
			return res.json(401, {err: 'Invalid token'});
		}
		req.user = decoded;
		next();
	});
};
