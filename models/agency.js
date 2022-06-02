const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AgenceSchema = new Schema({
    name: String,
    adress: String,
    phone: Number,
    email: String,
    description: String,
 

    cars:
        [
            {

                Model: String,
                Price: Number,
                Status: String,
                Description: String,

                Images:
                    [

                        {
                            _id: false,
                            url: String,
                            filename: String
                        }

                    ]

            }
        ]
})


module.exports = mongoose.model('Agency', AgenceSchema);

