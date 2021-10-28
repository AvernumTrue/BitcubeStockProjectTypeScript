"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Email = require('../src/email');
const Product = require('../src/product');
const helpers = require('./helpers');
const seedProducts = require('./seedProducts');
mongoose.connect('mongodb://localhost:27017/stockManager', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
    .then(() => {
        console.log('Mongo connection open');
    })
    .catch(err => {
        console.log('Mongo connection error');
        console.log(err);
    });
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.get('/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield Product.find({});
    const error = req.query.error;
    if (products == 0) {
        Product.insertMany(seedProducts);
    }
    res.render('products/index', { products, error });
}));
app.patch('/products', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { _id } = req.body;
        const existingProduct = yield Product.findById(_id);
        const mergedProduct = helpers.addStockToProduct(existingProduct, Number(req.body.price), Number(req.body.quantity));
        yield Product.findByIdAndUpdate(_id, mergedProduct, { runValidators: true, new: true });
        res.redirect('/products');
    }
    catch (err) {
        next(err);
    }
}));
app.post('/products/remove', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const matchingEmails = yield Email.find({ email });
        console.log(`Matching Emails`, matchingEmails);
        if (matchingEmails.length > 0) {
            const errorMessage = `This email address: (${email}) has already removed a product, please use a different email address.`;
            return res.redirect(`/products?error=${errorMessage}`);
        }
        const newEmail = new Email({
            email,
        });
        console.log(`New Email`, email);
        yield newEmail.save();
        const { _id } = req.body;
        const existingQuantity = yield Product.findById(_id);
        req.body.quantity = existingQuantity.quantity - req.body.quantity;
        yield Product.findByIdAndUpdate(_id, req.body);
        res.redirect('/products');
    }
    catch (err) {
        next(err);
    }
}));
app.post('/products', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newProduct = new Product(req.body);
        yield newProduct.save();
        res.redirect('/products');
    }
    catch (err) {
        next(err);
    }
}));
app.get('/products/new', (req, res, next) => {
    try {
        res.render('products/new', {});
    }
    catch (err) {
        next(err);
    }
});
app.delete('/products/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield Product.findByIdAndDelete(id);
        res.redirect('/products');
    }
    catch (err) {
        next(err);
    }
}));
app.listen(3000, () => {
    console.log('app listening on 3000');
});
