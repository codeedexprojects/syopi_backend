const Address = require("../../../Models/User/AddressModel");

//create address
exports.addAddress = async (req, res) => {
  try {
    const {
      name,
      number,
      alternatenumber,
      address,
      landmark,
      pincode,
      city,
      state,
      addressType,
      defaultAddress,
    } = req.body;

    if (defaultAddress) {
      await Address.updateMany({ userId }, { defaultAddress: false });
    }

    const newAddress = new Address({
      userId: req.user.id,
      name,
      number,
      alternatenumber,
      address,
      landmark,
      pincode,
      city,
      state,
      addressType,
      defaultAddress: !!defaultAddress,
    });

    await newAddress.save();
    res.status(200).json({ message: "Address added successfully",address: newAddress });
  } catch (error) {
    res.status(500).json({ message: "Error adding product to wishlist",error: error.message });
  }
};

// Get all addresses for a user
exports.getAddressesByUserId = async(req,res) =>{
    try {
        const userId = req.user.id;
        const addresses = await Address.find({ userId });

        if (!addresses || addresses.length === 0) {
            return res.status(404).json({ message: "No addresses found for this user" });
        }
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching addressed", error: error.message });
    }
}

// Update an address by ID
exports.updateAddress = async (req, res) => {
    try {
      const { id } = req.params;
      const { defaultAddress, ...updatedData } = req.body;
  
      // Find the address to update
      const address = await Address.findById(id);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
  
      // If defaultAddress is true, unset defaultAddress for all other addresses of the user
      if (defaultAddress) {
        await Address.updateMany({ userId: address.userId, _id: { $ne: id } }, { defaultAddress: false });
      }
  
      // Update the address
      const updatedAddress = await Address.findByIdAndUpdate(
        id,
        { ...updatedData, defaultAddress: !!defaultAddress }, // Ensure defaultAddress is a boolean
        { new: true }
      );
  
      res.status(200).json({ message: "Address updated successfully", address: updatedAddress });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Delete an address by ID
exports.deleteAddress = async (req, res) => {
    try {
      const { id } = req.params;
  
      const address = await Address.findByIdAndDelete(id);
  
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
  
      res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getDefaultAddress = async(req,res) => {
  const userId = req.user.id;
  try {
    const address = await Address.findOne({ userId, defaultAddress: true });

    if (!address || address.length === 0) {
      return res.status(404).json({ message: "No deafult true addresses found for this user" });
    }
    
    res.status(200).json(address);
  } catch (error) {
    res.status(500).json({ message: "Error fetching address", error: error.message });
  }
}