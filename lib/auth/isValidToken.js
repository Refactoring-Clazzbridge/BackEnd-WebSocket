// isValidToken.js

export const isTokenValid = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64').toString('utf-8')
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);

    // 만료 시간 체크
    return exp > Date.now() / 1000;
  } catch (error) {
    console.error("Token is invalid:", error);
    throw new Error("Invalid token"); // 에러를 호출하는 쪽에서 처리할 수 있도록 throw
  }
}