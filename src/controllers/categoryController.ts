import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
const prisma = new PrismaClient();

async function CreateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;

    await prisma.$transaction(async (prisma) => {
      const findCategory = await prisma.category.findFirst({
        where: {
          name,
        },
      });

      if (findCategory) {
        throw new Error("Category with that name already exist");
      }

      const category = await prisma.category.create({
        data: {
          name,
        },
      });

      res.status(200).send({
        message: "Success",
        data: {
          category,
        },
      });
    });
  } catch (err) {
    next(err);
  }
}

async function GetCategories(req: Request, res: Response, next: NextFunction) {
  try {
    interface IFilter {
      page: number;
      pageSize: number;
    }

    const { page, pageSize } = req.query;

    const filter: IFilter = {
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10,
    };

    const skip = (filter.page - 1) * filter.pageSize;

    const data = await prisma.category.findMany({
      skip: skip,
      take: filter.pageSize,
    });

    res.status(200).send({
      message: "success",
      data,
      pagination: {
        currentPage: filter.page,
        pageSize: filter.pageSize,
      },
    });
  } catch (err) {
    next(err);
  }
}


async function GetCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const data = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    })

    res.status(200).send({
      message: "success",
      data,
    });
  } catch (err) {
    next(err);
  }

}


async function UpdateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const data = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.status(200).send({
      message: "success",
      data
    });

  } catch (err) {
    next(err)
  }

}


async function DeleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = await prisma.category.delete({ where: { id: parseInt(id) } });

    res.status(200).send({
      message: "success",
      data
    })
  } catch (err) {
    next(err)
  }
}

export { CreateCategory, GetCategories, GetCategory, UpdateCategory, DeleteCategory }