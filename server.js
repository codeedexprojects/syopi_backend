require("dotenv").config()
const express = require("express")
const cors = require("cors")
const passport = require('passport')
require('./DB/mongo')
const path = require('path')
const app = express()
const cron = require('node-cron')
app.use(cors())
app.use(express.json())

const removeExpiredOffers = require("./utils/removeExpiredOffers")
const { scheduleCouponCron ,schedulePayoutCron} = require('./utils/cronTasks')
require('./Configs/passportConfigGoogle')

const tokenRefresh=require('./Routes/RefreshToken/RefreshRoute')
const adminAuth=require('./Routes/Admin/Auth/AuthRoute')
const userAuth=require('./Routes/User/Auth/AuthRoute')
const adminCoupon = require('./Routes/Admin/coupon/couponRoute')
const offerRoutes = require('./Routes/Admin/offer/offerRoute')
const CategoryRoutes = require('./Routes/Admin/Category/CategouryRoute');
const SubcategoryRoutes = require('./Routes/Admin/SubCategory/SubCategoryRoute');
const SliderRoutes = require('./Routes/Admin/Slider/SliderRoute');
const NotificationRoute = require('./Routes/Admin/Notification/NotificationRoute');
const vendorRoute = require('./Routes/Admin/Vendor/VendorRoute');
const userRoute = require('./Routes/Admin/User/UserRoute');
const vendorAuth = require('./Routes/Vendor/Auth/AuthRoute');
const vendorCategoryRoute = require('./Routes/Vendor/Category/CategoryRoute');
const vendorSubcategoryRoute = require('./Routes/Vendor/SubCategory/SubcategoryRoute');
const vendorNotificationRoute = require('./Routes/Vendor/Notification/NotificationRoute');
const vendorSliderRoute = require('./Routes/Vendor/Slider/SliderRoute');
const UserCategories=require('./Routes/User/Category/CategoryRoute')
const UserSubCategories=require('./Routes/User/SubCategory/SubCategoryRoute')
const userProducts=require('./Routes/User/Products/Products')
const userBrands = require('./Routes/User/Brand/BrandRoute')

const userCart=require('./Routes/User/Cart/CartRoute')
const Checkout=require('./Routes/User/Checkout/CheckoutRoute')
const Review = require('./Routes/User/Reviews/Review')
const Dashboard = require('./Routes/Admin/Dashboard/DashboardRoute')
const VendorDashboard = require('./Routes/Vendor/Dashboard/VendorDashboardRoute')
const AdminCommission = require('./Routes/Admin/commission/CommissionRoute')
const VendorPayout=require('./Routes/Admin/VendorPayout/VendorPayoutRoute')



const vendorProductRoute = require('./Routes/Vendor/Product/productRoute')
const adminProductRoute = require('./Routes/Admin/Product/productRoute')
const vendorOfferRoute = require('./Routes/Vendor/Offer/OfferRoute')
const vendorCouponRoute = require('./Routes/Vendor/Coupon/couponRoute');
const userWishlistRoute = require('./Routes/User/Wishlist/WishlistRoute');
const adminWishlistRoute = require('./Routes/Admin/Wishlist/WishlistRoute');
const vendorWishlistRoute = require('./Routes/Vendor/Wishlist/WishlistRoute');
const userAddressRoute = require('./Routes/User/Address/addressRoute');
const adminProfileRoute = require('./Routes/Admin/Profile/profileRoute');
const userProfileRoute = require('./Routes/User/Profile/profileRoute');
const vendorProfileRoute = require('./Routes/Vendor/Profile/profileRoute');
const userOrderRoute = require('./Routes/User/order/orderRoute');
const userSliderRoute = require('./Routes/User/Slider/SliderRoute');
const adminCoinRoute = require('./Routes/Admin/Coin/CoinRoute')
const adminDeliveryChargeRoute = require('./Routes/Admin/DeliveryCharge/DeliveryChargeRoute')
const adminBannerRoute = require('./Routes/Admin/Banner/BannerRoute')
const adminOrderRoute = require('./Routes/Admin/Order/AdminOrderRoute')
const vendorOrderRoute = require('./Routes/Vendor/Order/VendorOrderRoute')
const adminBrandRoute = require('./Routes/Admin/Brand/BrandRoute')
const AdminPurchaseRoute = require('./Routes/Admin/PurchaseManagement/AdminPurchaseRoute')
const VendorPurchaseRoute = require('./Routes/Vendor/PurchaseManagement/VendorPurchaseRoute')
const HomepageEditorRoute = require('./Routes/Admin/Homepage/HomepageEditorRoute')

const homeRoute = require('./Routes/User/Home/HomeRoute')



app.use('/token',tokenRefresh)
app.use(passport.initialize())

// admin routes
app.use('/api/admin/auth', adminAuth)
app.use('/api/admin/coupon', adminCoupon)
app.use('/api/admin/category', CategoryRoutes);
app.use('/api/admin/subcategory',SubcategoryRoutes);
app.use('/api/admin/slider',SliderRoutes);
app.use('/api/admin/notification',NotificationRoute);
app.use('/api/admin/vendor', vendorRoute);
app.use('/api/admin/user', userRoute);
app.use('/api/admin/offer', offerRoutes)
app.use('/api/admin/product', adminProductRoute) 
app.use('/api/admin/wishlist', adminWishlistRoute)
app.use('/api/admin/profile', adminProfileRoute)
app.use('/api/admin/orders', adminOrderRoute)
app.use('/api/admin/brand', adminBrandRoute)
app.use('/api/admin/purchase', AdminPurchaseRoute)
app.use('/api/admin/homepageedit', HomepageEditorRoute)

app.use('/api/admin/coin',adminCoinRoute)
app.use('/api/admin/deliverycharge',adminDeliveryChargeRoute)
app.use('/api/admin/dashboard',Dashboard)
app.use('/api/admin/banner', adminBannerRoute)
app.use('/api/admin/commission', AdminCommission)
app.use('/api/admin/vendorpayout', VendorPayout)




// vendor
app.use('/api/vendor/auth', vendorAuth);
app.use('/api/vendor/category', vendorCategoryRoute);
app.use('/api/vendor/subcategory', vendorSubcategoryRoute);
app.use('/api/vendor/notification', vendorNotificationRoute);
app.use('/api/vendor/slider', vendorSliderRoute);
app.use('/api/vendor/product', vendorProductRoute)
app.use('/api/vendor/offer', vendorOfferRoute)
app.use('/api/vendor/coupon', vendorCouponRoute)
app.use('/api/vendor/wishlist', vendorWishlistRoute)
app.use('/api/vendor/profile', vendorProfileRoute)
app.use('/api/vendor/orders', vendorOrderRoute)
app.use('/api/vendor/dashboard',VendorDashboard)
app.use('/api/vendor/purchase',VendorPurchaseRoute)





// user routes
app.use('/api/user/auth',userAuth)
app.use('/api/user/categories',UserCategories)
app.use('/api/user/Subcategories',UserSubCategories)
app.use('/api/user/Products',userProducts)
app.use('/api/user/cart',userCart)
app.use('/api/user/wishlist',userWishlistRoute)
app.use('/api/user/address',userAddressRoute)
app.use('/api/user/profile',userProfileRoute)
app.use('/api/user/checkout',Checkout)
app.use('/api/user/order',userOrderRoute)
app.use('/api/user/slider',userSliderRoute)
app.use('/api/user/home', homeRoute)
app.use('/api/user/review', Review)
app.use('/api/user/brand', userBrands)

//Landing page
app.use('/home', homeRoute)

scheduleCouponCron();
schedulePayoutCron();


// Schedule the cron job to run every day at midnight
cron.schedule("0 0 * * *", async () => {
    console.log("Running daily expired offers cleanup...");
    try {
      await removeExpiredOffers();
    } catch (error) {
      console.error("Error during expired offers cleanup:", error);
    }
  });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
 
const PORT = 3006 || process.env.PORT
app.listen(PORT,()=>{
    console.log(`server started listening at PORT ${PORT}`);
})