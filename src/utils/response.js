// Format response SubTrack: { success, message, data } atau { success:false, message, errors }
function ok(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, status = 400, errors = undefined) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { ok, fail };