import Gig from "../models/gig.model.js";
import createError from "../utils/createError.js";

export const createGig = async (req, res, next) => {
  if (!req.isSeller)
    return next(createError(403, "Only sellers can create a gig!"));

  const newGig = new Gig({
    userId: req.userId,
    ...req.body,
  });
  console.log(newGig);
  console.log("power234");
  try {
    const savedGig = await newGig.save();

    res.status(201).json(savedGig);
  } catch (err) {
    console.log(err);
    console.log("gigget");
    next(err);
  }
};
export const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (gig.userId !== req.userId)
      return next(createError(403, "You can delete only your gig!"));

    await Gig.findByIdAndDelete(req.params.id);
    res.status(200).send("Gig has been deleted!");
  } catch (err) {
    next(err);
  }
};
export const getGig = async (req, res, next) => {
  console.log("single gig");
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) next(createError(404, "Gig not found!"));
    res.status(200).send(gig);
  } catch (err) {
    next(err);
  }
};
export const getGigs = async (req, res, next) => {
  const q = req.query;
  console.log(q);

  const filters = {
    ...(q.userId && { userId: q.userId }),
    ...(q.cat && { cat: q.cat }),
    ...((q.min || q.max) && {
      price: {
        ...(q.min && { $gte: q.min }), // Greater than or equal to q.min
        ...(q.max && { $lte: q.max }), // Less than or equal to q.max
      },
    }),
    ...(q.search && { title: { $regex: q.search, $options: "i" } }),
  };

  console.log(filters);
  try {
    const gigs = await Gig.find(filters).sort({ [q.sort]: -1 });
    console.log(gigs);
    res.status(200).send(gigs);
  } catch (err) {
    console.log(err);
    next(err);
  }
};
