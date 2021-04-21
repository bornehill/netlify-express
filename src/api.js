const express = require("express");
const serverless = require("serverless-http");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const StatusCode = require("./util/ApiResponse");
const users = require("./repository/user.mock");

const app = express();
const router = express.Router();

let response = {
	ok: false,
	data: null,
	message: null,
	statusCode: StatusCode.BAD_REQUEST,
};

router.get("/", (req, res) => {
	response.statusCode = StatusCode.Ok;
	response.message = "Hi!";
	response.ok = false;
	response.data = null;
	res.json(response);
});

router.get("/menu", async (req, res) => {
	try {
		response.data = null;
		response.ok = false;

		const menu = [
			{
				id: 1,
				label: "My Fav videos",
				icon: "FaVoteYea",
				url: "/fav",
			},
		];

		const token = req.headers["x-auth-token"]
			? req.headers["x-auth-token"].split("Bearer")[1]
			: null;

		if (!token) {
			response.message = "Invalid credentials";
			response.statusCode = StatusCode.UNAUTHORIZED;
			res.json(response);
		} else {
			const decoded = jwt.verify(token.trim(), "5up3r53cr37");

			if (Date.now >= decoded.exp * 1000) {
				response.message = "Invalid token";
				response.statusCode = StatusCode.UNAUTHORIZED;
				res.json(response);
			} else {
				response.message = "Succeded";
				response.data = menu;
				response.statusCode = StatusCode.Ok;
				response.ok = true;
				res.json(response);
			}
		}
	} catch (err) {
		response.message = "Invalid token";
		response.statusCode = StatusCode.UNAUTHORIZED;
		res.json(response);
	}
});

router.post("/auth", async (req, res) => {
	let token = null;

	const { email, password } = req.body;
	const user = users.find(
		(usr) => usr.email === email && usr.password === password
	);

	if (user) {
		const payload = {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		};

		token = jwt.sign(payload, "5up3r53cr37", { expiresIn: "1d" });
	}

	if (token) {
		response.message = "Sign in succeded";
		response.data = { token };
		response.ok = true;
		response.statusCode = StatusCode.Ok;
		res.json(response);
	} else {
		response.message = "Invalid credentials";
		response.data = null;
		response.ok = false;
		response.statusCode = StatusCode.UNAUTHORIZED;
		res.json(response);
	}
});

app.use(express.json());
app.use(cors());
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
