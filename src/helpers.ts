const helpers = {
    addStockToProduct: (oldProduct: { price: number; quantity: number; _id: any; name: any; }, addPrice: number, addQuantity: number) => {
        const oldPriceTotal = oldProduct.price * oldProduct.quantity;
        const newPriceTotal = addPrice * addQuantity;
        const totalPrice = oldPriceTotal + newPriceTotal;
        const totalQuantity = oldProduct.quantity + addQuantity;
        return {
            _id: oldProduct._id,
            name: oldProduct.name,
            price: totalPrice / totalQuantity,
            quantity: totalQuantity,
        };
    },
};

module.exports = helpers;