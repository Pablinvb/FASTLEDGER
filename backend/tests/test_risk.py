from app.services.risk import deterministic_risk_score


def test_drones_score_higher_than_standard_product():
    standard = deterministic_risk_score("ropa", "Alemania", fob_value=1000)
    drones = deterministic_risk_score(
        "drones profesionales",
        "China",
        fob_value=50_000,
        permits_count=3,
    )
    assert drones > standard
    assert 0 <= drones <= 100


def test_score_is_capped_at_one_hundred():
    score = deterministic_risk_score(
        "arma quimico drones bateria",
        "India",
        fob_value=1_000_000,
        permits_count=20,
    )
    assert score == 100
