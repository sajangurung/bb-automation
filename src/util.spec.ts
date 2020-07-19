import { splitFullName } from "./util";

describe("Util", () => {
  test("cleanFileName", () => {
    const input = "{8fbe1e67-8a41-4719-8d33-cced6d1860ec}~PRODUCTION Client Portal.json";
    expect(splitFullName(input)).toStrictEqual([
      "{8fbe1e67-8a41-4719-8d33-cced6d1860ec}",
      "PRODUCTION",
      "Client Portal",
      "{8fbe1e67-8a41-4719-8d33-cced6d1860ec}~PRODUCTION Client Portal.json",
    ]);
  });
});
