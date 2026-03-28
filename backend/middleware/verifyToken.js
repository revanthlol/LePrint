const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        console.log("❌ No auth header");
        return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.log("❌ No token");
        return res.status(401).json({ error: "Malformed token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        console.log("✅ Token valid");
        next(); // VERY IMPORTANT
    } catch (err) {
        console.log("❌ Token invalid:", err.message);
        return res.status(403).json({ error: "Invalid token" });
    }
};
