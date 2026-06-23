HIGH_RISK_PRODUCTS = {
    "drone": 28,
    "drones": 28,
    "arma": 40,
    "quimico": 26,
    "químico": 26,
    "medicamento": 24,
    "bateria": 18,
    "batería": 18,
    "alcohol": 20,
}

COUNTRY_RISK = {
    "china": 12,
    "turquia": 14,
    "turquía": 14,
    "india": 15,
    "estados unidos": 5,
    "alemania": 4,
    "ecuador": 6,
}


def deterministic_risk_score(
    product: str,
    origin_country: str,
    *,
    fob_value: float | None = None,
    permits_count: int = 0,
) -> int:
    text = product.lower()
    score = 18 + COUNTRY_RISK.get(origin_country.lower(), 10)
    score += max((value for key, value in HIGH_RISK_PRODUCTS.items() if key in text), default=4)
    score += min(permits_count * 4, 20)
    if fob_value and fob_value > 100_000:
        score += 10
    elif fob_value and fob_value > 25_000:
        score += 5
    return max(0, min(round(score), 100))
