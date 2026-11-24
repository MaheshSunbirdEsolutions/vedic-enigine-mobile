import { ApiError, errorMessageKey, parseErrorDetail } from "./errors";

describe("parseErrorDetail", () => {
  it("handles string, list and non-JSON bodies", () => {
    expect(parseErrorDetail('{"detail":"kundli not found"}')).toBe("kundli not found");
    expect(parseErrorDetail('{"detail":[{"loc":["body","lat"],"msg":"bad"},{"msg":"other"}]}')).toBe("lat: bad; other");
    expect(parseErrorDetail("plain text")).toBe("plain text");
    expect(parseErrorDetail("")).toBeUndefined();
  });
});

describe("errorMessageKey", () => {
  it.each([
    [new ApiError({ kind: "network", path: "/" }), "engine_down"],
    [new ApiError({ kind: "timeout", path: "/" }), "err_timeout"],
    [new ApiError({ kind: "http", status: 404, path: "/" }), "not_found"],
    [new ApiError({ kind: "http", status: 422, path: "/" }), "err_validation"],
    [new ApiError({ kind: "http", status: 503, path: "/" }), "err_server"],
    [new ApiError({ kind: "parse", path: "/" }), "err_parse"],
    [new Error("x"), "err_unknown"],
  ])("%s → %s", (e, key) => expect(errorMessageKey(e)).toBe(key));
});
