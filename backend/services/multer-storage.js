const fs = require('fs');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!req.body || !req.body.uid) {
            cb(new Error('Missing parameter in request body or order of uid is incorrect. (uid should be first in body)'));
        } else {
            let foldrPath = `./user_uploads/${req.body.uid}`;
            console.log(foldrPath)
            if (!fs.existsSync(foldrPath)) {
                fs.mkdirSync(foldrPath);
            }
            cb(null, `${foldrPath}`)
        }
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage
});

module.exports = {
    upload
}