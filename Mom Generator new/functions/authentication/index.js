const catalyst = require("zcatalyst-sdk-node");

/**
 * @param {import('./types/basicio').Context} context 
 * @param {import('./types/basicio').BasicIO} basicIO 
 */
module.exports = (context, basicIO) => {

	const catalystApp = catalyst.initialize(context);

	// Get signup request details
	const requestDetails = catalystApp
		.userManagement()
		.getSignupValidationRequest(basicIO);

	if (requestDetails) {

		const user = requestDetails.user_details;

		// Allow ALL email domains
		basicIO.write(JSON.stringify({
			status: "success",
			user_details: {
				first_name: user.first_name,
				last_name: user.last_name,
				email_id: user.email_id,
				role_identifier: "App User",   // default role
				org_id: ""
			}
		}));
	}

	context.close();
};
