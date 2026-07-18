import { Response } from "express";
import foodService from "../services/foodService";
import { AuthRequest } from "../middleware/authMiddleware";

class FoodController {
  /**
   * POST /foods
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const food = await foodService.createFood(req.userId!, req.body);

      return res.status(201).json(food);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * GET /foods
   */
  async search(req: AuthRequest, res: Response) {
    try {
      const foods = await foodService.searchFoods(req.userId!, {
        name: req.query.name as string,
        barcode: req.query.barcode as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      return res.status(200).json(foods);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * GET /foods/:id
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const foodId = req.params.id as string;
      const food = await foodService.getFood(foodId);

      return res.status(200).json(food);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * PATCH /foods/:id
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const foodId = req.params.id as string;
      const food = await foodService.updateFood(req.userId!, foodId, req.body);

      return res.status(200).json(food);
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * DELETE /foods/:id
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const foodId = req.params.id as string;
      await foodService.deleteFood(req.userId!, foodId);

      return res.status(200).json({
        message: "Food deleted successfully",
      });
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * POST /foods/:id/favourite
   */
  async addFavourite(req: AuthRequest, res: Response) {
    try {
      const foodId = req.params.id as string;
      await foodService.addFavourite(req.userId!, foodId);

      return res.status(201).json({
        message: "Food added to favourites",
      });
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * DELETE /foods/:id/favourite
   */
  async removeFavourite(req: AuthRequest, res: Response) {
    try {
      const foodId = req.params.id as string;
      await foodService.removeFavourite(req.userId!, foodId);

      return res.status(200).json({
        message: "Food removed from favourites",
      });
    } catch (error) {
      return handleError(error, res);
    }
  }

  /**
   * GET /foods/favourites
   */
  async getFavourites(req: AuthRequest, res: Response) {
    try {
      const favourites = await foodService.getFavouriteFoods(req.userId!);

      return res.status(200).json(favourites);
    } catch (error) {
      return handleError(error, res);
    }
  }
}

function handleError(error: unknown, res: Response) {
  if (!(error instanceof Error)) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }

  switch (error.message) {
    case "Food not found":
      return res.status(404).json({ message: error.message });

    case "Official foods cannot be modified":
    case "Official foods cannot be deleted":
    case "Unauthorized access to food":
      return res.status(403).json({ message: error.message });

    case "Barcode already exists":
    case "Food already favourited":
    case "Favourite not found":
    case "Food name is required":
    case "Serving size must be greater than zero":
    case "Calories cannot be negative":
    case "Protein cannot be negative":
    case "Carbohydrates cannot be negative":
    case "Fat cannot be negative":
      return res.status(400).json({ message: error.message });

    default:
      return res.status(500).json({
        message: "Internal server error",
      });
  }
}

export default new FoodController();
