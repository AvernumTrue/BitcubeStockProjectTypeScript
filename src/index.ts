const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override')
const Email = require('./models/email');
const Product = require('./models/product');
const helpers = require('./helpers');
const seedProducts = require('./seedProducts')

mongoose.connect('mongodb://localhost:27017/stockManager', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
    .then(() => {
        console.log('Mongo connection open')
    })
    .catch((err: any) => {
        console.log('Mongo connection error')
        console.log(err)
    })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/products', async (req: { query: { error: any; }; }, res: { render: (arg0: string, arg1: { products: any; error: any; }) => void; }) => {
    const products = await Product.find({});
    const error = req.query.error;
    if (products == 0) {
        Product.insertMany(seedProducts)
    }
    res.render('products/index', { products, error });
})

app.patch('/products', async (req: { body: { price?: any; quantity?: any; _id?: any; }; }, res: { redirect: (arg0: string) => void; }, next: (arg0: unknown) => void) => {
    try {
        const { _id } = req.body;
        const existingProduct = await Product.findById(_id);
        const mergedProduct = helpers.addStockToProduct(existingProduct, Number(req.body.price), Number(req.body.quantity));
        await Product.findByIdAndUpdate(_id, mergedProduct, { runValidators: true, new: true });
        res.redirect('/products');
    } catch (err) {
        next(err);
    }
})

app.post('/products/remove', async (req: { body: { email?: any; quantity?: any; _id?: any; }; }, res: { redirect: (arg0: string) => void; }, next: (arg0: unknown) => void) => {
    try {
        const email = req.body.email;
        const matchingEmails = await Email.find({ email });
        console.log(`Matching Emails`, matchingEmails);
        if (matchingEmails.length > 0) {
            const errorMessage = `This email address: (${email}) has already removed a product, please use a different email address.`;
            return res.redirect(`/products?error=${errorMessage}`);
        }
        const newEmail = new Email({
            email,
        });
        console.log(`New Email`, email);
        await newEmail.save();
        const { _id } = req.body;
        const existingQuantity = await Product.findById(_id);
        req.body.quantity = existingQuantity.quantity - req.body.quantity
        await Product.findByIdAndUpdate(_id, req.body);
        res.redirect('/products');
    } catch (err) {
        next(err);
    }
})

app.post('/products', async (req: { body: any; }, res: { redirect: (arg0: string) => void; }, next: (arg0: unknown) => void) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.redirect('/products')
    } catch (err) {
        next(err);
    }
})

app.get('/products/new', (req: any, res: { render: (arg0: string, arg1: {}) => void; }, next: (arg0: unknown) => void) => {
    try {
        res.render('products/new', {})
    } catch (err) {
        next(err);
    }
})

app.delete('/products/:id', async (req: { params: { id: any; }; }, res: { redirect: (arg0: string) => void; }, next: (arg0: unknown) => void) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.redirect('/products');
    } catch (err) {
        next(err);
    }
})

app.listen(3000, () => {
    console.log('app listening on 3000')
})


