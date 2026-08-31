const menuItemIngredientService = require("../services/menuItemIngredient.service");
const getSafeErrorMessage = require("../utils/errorMessage");

exports.addIngredientsToMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredients } = req.body;

    const result =
      await menuItemIngredientService.addIngredientsToMenuItem(
        id,
        ingredients
      );

    return res.status(201).json({
      success: true,
      message: "Ingredients added to menu item successfully",
      count: result.count,
    });
  } catch (err) {
    console.error(err);

    return res.status(err.status || 500).json({
      success: false,
      error: getSafeErrorMessage(err, "Couldn't add ingredients to menu item"),
    });
  }
};