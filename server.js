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
const vendorBrandRoute = require('./Routes/Vendor/Brand/BrandRoute.js')
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
const notificationRoute=require('./Routes/User/Notification/notificationRoute.js')



app.use('/token',tokenRefresh)
app.use(passport.initialize())

// admin routes
app.use('/admin/auth', adminAuth)
app.use('/admin/coupon', adminCoupon)
app.use('/admin/category', CategoryRoutes);
app.use('/admin/subcategory',SubcategoryRoutes);
app.use('/admin/slider',SliderRoutes);
app.use('/admin/notification',NotificationRoute);
app.use('/admin/vendor', vendorRoute);
app.use('/admin/user', userRoute);
app.use('/admin/offer', offerRoutes)
app.use('/admin/product', adminProductRoute) 
app.use('/admin/wishlist', adminWishlistRoute)
app.use('/admin/profile', adminProfileRoute)
app.use('/admin/orders', adminOrderRoute)
app.use('/admin/brand', adminBrandRoute)
app.use('/admin/purchase', AdminPurchaseRoute)
app.use('/admin/homepageedit', HomepageEditorRoute)

app.use('/admin/coin',adminCoinRoute)
app.use('/admin/deliverycharge',adminDeliveryChargeRoute)
app.use('/admin/dashboard',Dashboard)
app.use('/admin/banner', adminBannerRoute)
app.use('/admin/commission', AdminCommission)
app.use('/admin/vendorpayout', VendorPayout)




// vendor
app.use('/vendor/auth', vendorAuth);
app.use('/vendor/category', vendorCategoryRoute);
app.use('/vendor/subcategory', vendorSubcategoryRoute);
app.use('/vendor/notification', vendorNotificationRoute);
app.use('/vendor/slider', vendorSliderRoute);
app.use('/vendor/product', vendorProductRoute)
app.use('/vendor/offer', vendorOfferRoute)
app.use('/vendor/coupon', vendorCouponRoute)
app.use('/vendor/wishlist', vendorWishlistRoute)
app.use('/vendor/profile', vendorProfileRoute)
app.use('/vendor/orders', vendorOrderRoute)
app.use('/vendor/dashboard',VendorDashboard)
app.use('/vendor/purchase',VendorPurchaseRoute)
app.use('/vendor/brand', vendorBrandRoute)





// user routes
app.use('/user/auth',userAuth)
app.use('/user/categories',UserCategories)
app.use('/user/Subcategories',UserSubCategories)
app.use('/user/Products',userProducts)
app.use('/user/cart',userCart)
app.use('/user/wishlist',userWishlistRoute)
app.use('/user/address',userAddressRoute)
app.use('/user/profile',userProfileRoute)
app.use('/user/checkout',Checkout)
app.use('/user/order',userOrderRoute)
app.use('/user/slider',userSliderRoute)
app.use('/user/home', homeRoute)
app.use('/user/review', Review)
app.use('/user/brand', userBrands)
app.use('/user/notification',notificationRoute)

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