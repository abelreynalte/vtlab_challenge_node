import Deliveries from '@/models/Deliveries.model';

const find = async (req) => {
  // some vars
  let query = {};
  let limit = req.body.limit ? (req.body.limit > 100 ? 100 : parseInt(req.body.limit)) : 100;
  let skip = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
  let sort = { _id: 1 }

  // if date provided, filter by date
  if (req.body.when) {
    query['when'] = {
      '$gte': req.body.when
    }
  };

  let totalResults = await Deliveries.find(query).countDocuments();

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`
      }
    }
  }

  let deliveries = await Deliveries.find(query).skip(skip).sort(sort).limit(limit);

  return {
    totalResults: totalResults,
    deliveries
  }
}

const create = async (req) => {
  try {
    await Deliveries.create(req.body);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`
      }
    }
  }
}

const findOne = async (req) => {
  let delivery = await Deliveries.findOne({_id: req.body.id});
  if (!delivery) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find a delivery with the sent ID`
      }
    }
  }
  return delivery;
}

const findCustom = async (req) => {
  // some vars
  let query = {};
  let match = {};
  let limit = req.body.limit ? (req.body.limit > 100 ? 100 : parseInt(req.body.limit)) : 100;
  let skip = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
  let sort = { _id: 1 }

  // if date provided datefrom, filter by date
  if (req.body.datefrom) {
    query['when'] = {
      '$gte': req.body.datefrom
    }
  };

  // if date provided dateto, filter by date
  if (req.body.dateto) {
    query['when'] = {
      '$lte': req.body.dateto
    }
  };

  // if match provided
  if (req.body.weight) {
    match = {
      weight: req.body.weight
    }
  };

  let totalResults = await Deliveries.find(query)
                          .where('products').ne([])
                          .populate({
                            path: 'products',
                            match
                          })
                          .skip(0).limit();

  let dataResults = await filterProductsEmpty(totalResults);                                
                          
  console.log('totalResults: ' + dataResults.length)                          

  if (dataResults.length < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`
      }
    }
  }

  let deliveries = await Deliveries.find(query)
                        .where('products').ne([])
                        .populate({
                          path: 'products',
                          match
                        })                     
                        .skip(skip).sort(sort).limit(limit);

  let data = await filterProductsEmpty(deliveries);                        

  return {
    totalResults: dataResults.length,
    deliveries: data
  }
}

const filterProductsEmpty = async (data) => {
  let response = [];
  data.forEach(item => {
    if (item.products.length > 0) {
      response.push(item);
    }
  });

  return response;
}

export default {
  find,
  create,
  findOne,
  findCustom
}
