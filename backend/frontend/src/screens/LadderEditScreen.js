import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Fade, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import axios from "axios";

import Loader from "../components/Loader";
import Message from "../components/Message";
import FormContainer from "../components/FormContainer";
import {
  detailsLadder,
  updateLadder,
  deleteLadder,
} from "../actions/ladderActions";
import {
  LADDER_UPDATE_RESET,
  LADDER_DELETE_RESET,
} from "../constants/ladderConstants";

function LadderEditScreen() {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const ladderDetails = useSelector((state) => state.ladderDetails);
  const { loading: loadingLadder, error: errorLadder, ladder } = ladderDetails;
  const ladderUpdate = useSelector((state) => state.ladderUpdate);
  const {
    loading: loadingLadderUpdate,
    error: errorLadderUpdate,
    success: successUpdate,
  } = ladderUpdate;
  const ladderDelete = useSelector((state) => state.ladderDelete);
  const {
    loading: deleteLoading,
    error: deleteError,
    success: deleteSuccess,
  } = ladderDelete;

  const [symbol, setSymbol] = useState("");
  const [symbolLocked, setSymbolLocked] = useState(false);
  const [symbolName, setSymbolName] = useState("");

  const [name, setName] = useState("Sample Name");
  const [amount_per_trade, setAmountPerTrade] = useState(0);
  const [budget, setBudget] = useState(0);
  const [cap, setCap] = useState(0);
  const [direction, setDirection] = useState("Both");
  const [enable, setEnable] = useState(false);
  const [gap, setGap] = useState(0.0);
  const [limit_price_in_percentage, setLimitPriceInPercentage] = useState(0);
  const [market, setMarket] = useState("");
  const [marketLocked, setMarketLocked] = useState(false);
  const [profit_per_trade, setProfitPerTrade] = useState(0);
  const [percent_per_trade, setPercentPerTrade] = useState(0);
  const [shares_per_trade, setSharesPerTrade] = useState(0);
  const [stop_price_in_percentage, setStopPriceInPercentage] = useState(0);
  const [type, setType] = useState("");
  const [typeLocked, setTypeLocked] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [capVisible, setCapVisible] = useState(false);
  const [priceVisible, setPriceVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPriceVisible(true);
    }, 1000);

    // Cleanup the timer if the component unmounts before the delay finishes
    return () => clearTimeout(timer);
  }, []); // Re-run effect if delay prop changes

  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    }
    if (successUpdate) {
      dispatch({ type: LADDER_UPDATE_RESET });
      const from = "/";
      navigate(from);
    }
    if (deleteSuccess) {
      dispatch({ type: LADDER_DELETE_RESET });
      const from = "/";
      navigate(from);
    }

    const ladderId = Number(params.id); //all items from the url are strings

    if (ladder?.name && ladder?._id === ladderId) {
      setName(ladder.name);
      setAmountPerTrade(ladder?.amount_per_trade || 0);
      setBudget(ladder?.budget || 0);
      setCap(Math.floor(ladder?.cap || 0));
      setDirection(ladder.direction || "Both");
      setEnable(ladder?.enable || false);
      setGap(ladder?.gap || 0);
      setLimitPriceInPercentage(ladder?.limit_price_in_percentage || 0);
      setMarket(ladder.market || "");
      setProfitPerTrade(ladder?.profit_per_trade || 0.0);
      setPercentPerTrade(ladder?.percent_per_trade || 0);
      setSharesPerTrade(
        ladder?.shares_per_trade > 1
          ? Math.floor(ladder?.shares_per_trade)
          : ladder?.shares_per_trade || 0
      );
      setStopPriceInPercentage(ladder?.stop_price_in_percentage || 0);
      setSymbol(ladder?.symbol || "");
      setSymbolName(ladder?.symbol_name || "");
      setType(ladder?.type || "");
      ladder?.type?.length > 1 && setTypeLocked(true);
      ladder?.symbol?.length > 1 && setSymbolLocked(true);
      ladder?.market === "Crypto" && setMarketLocked(true);
      ladder?.market === "Stocks" && setMarketLocked(true);
    } else {
      //console.log("get the ladder details: ", ladderId);
      dispatch(detailsLadder(ladderId));
    }
  }, [
    dispatch,
    navigate,
    userInfo,
    params,
    ladder,
    successUpdate,
    deleteSuccess,
  ]);

  const submitHandler = (e) => {
    e.preventDefault();
    //console.log("update ladder" + enable + true);
    dispatch(
      updateLadder({
        _id: ladder._id,
        market,
        name,
        amount_per_trade,
        budget,
        cap,
        direction,
        enable,
        gap,
        limit_price_in_percentage,
        profit_per_trade,
        percent_per_trade,
        shares_per_trade,
        stop_price_in_percentage,
        symbol,
        symbol_name: symbolName,
        type,
      })
    );

    const from = location.state?.from || "/";
    navigate(from);
  };

  const handleLookupSymbol = async (e) => {
    if (market === "") {
      alert(
        "Please select a market (Stocks or Crypto) before entering a symbol."
      );
      return;
    }
    
    const value = e.target.value;
    setSymbol(value);
    
    // Remove spaces and special characters for API call - symbols are alphanumeric only
    const sanitizedValue = value.replace(/\s+/g, '').trim();
    
    if (sanitizedValue.length > 0) {
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        let response;
        if (market === "Stocks") {
          response = await axios.get(
            `/api/ladders/lookupt/${sanitizedValue}/`,
            config
          );
        } else if (market === "Crypto") {
          response = await axios.get(
            `/api/ladders/lookupc/${sanitizedValue}/`,
            config
          );
        }

        setSuggestions(response.data.securities.security || []);
        setShowSuggestions(true);
      } catch (error) {
        //console.error("Error fetching symbol suggestions:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelection = (symbol, name) => {
    setSymbol(symbol);
    setSymbolName(name);
    setShowSuggestions(false);
  };
  const handleMarketChange = (e) => {
    setMarket(e.target.value);
    setSymbol("");
    setSymbolName("");
    setSuggestions([]);
    setShowSuggestions(false);
    setType("Percentage");
  };
  const handleTypeChange = (e) => {
    setType(e.target.value);
    if (type === "Percentage" && market === "Stocks") {
      setCapVisible(true);
    } else {
      setCapVisible(false);
    }
  };
  const deleteHandler = (id) => {
    if (window.confirm("Are you sure")) {
      dispatch(deleteLadder(id));
    }
  };

  return (
    <div>
      {loadingLadderUpdate ? (
        <Loader />
      ) : errorLadderUpdate ? (
        <Message variant="danger">{errorLadderUpdate}</Message>
      ) : (
        ""
      )}
      {loadingLadder ? (
        <Loader />
      ) : errorLadder ? (
        <Message variant="danger">{errorLadder}</Message>
      ) : (
        ""
      )}

      <Link to="/" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>
          Edit Ladder{" "}
          <Button
            variant="danger"
            className="btn-sm"
            onClick={() => deleteHandler(ladder._id)}
          >
            <i className="fas fa-trash"></i>
          </Button>
        </h1>
        <Form onSubmit={submitHandler}>
          <Row>
            <Col xs={2}>
              <Form.Group controlId="enable">
                <Form.Label>Enable</Form.Label>
                <Form.Check
                  type="switch"
                  placeholder="Enter enable"
                  checked={enable}
                  onChange={(e) => setEnable(e.target.checked)}
                ></Form.Check>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group controlId="direction">
                <Form.Label>Trading Direction</Form.Label>
                <InputGroup className="mb-3">
                  <Form.Check
                    inline
                    label="Buy"
                    value="Buy"
                    name="direction"
                    type="radio"
                    checked={direction === "Buy"}
                    id={`inline-radio-1`}
                    onChange={(e) => setDirection(e.target.value)}
                  />
                  <Form.Check
                    inline
                    label="Sell"
                    value="Sell"
                    name="direction"
                    type="radio"
                    checked={direction === "Sell"}
                    id={`inline-radio-2`}
                    onChange={(e) => setDirection(e.target.value)}
                  />
                  <Form.Check
                    inline
                    label="Both"
                    value="Both"
                    name="direction"
                    type="radio"
                    checked={direction === "Both"}
                    id={`inline-radio-3`}
                    onChange={(e) => setDirection(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col xs={4}>
              <Form.Group controlId="direction">
                <Form.Label>Market</Form.Label>
                <InputGroup className="mb-3">
                  <Form.Check
                    inline
                    label="Stocks"
                    value="Stocks"
                    name="market"
                    type="radio"
                    checked={market === "Stocks"}
                    disabled={marketLocked}
                    id={`inline-radio-1`}
                    onChange={handleMarketChange}
                  />
                  <Form.Check
                    inline
                    label="Crypto"
                    value="Crypto"
                    name="market"
                    type="radio"
                    checked={market === "Crypto"}
                    disabled={marketLocked}
                    id={`inline-radio-2`}
                    onChange={handleMarketChange}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col xs={6}>
              <Form.Label>Symbol</Form.Label>
              <Form.Control
                type="symbol"
                placeholder="Enter Symbol"
                value={symbol}
                disabled={symbolLocked}
                onChange={handleLookupSymbol}
              ></Form.Control>
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  className="list-group position-absolute w-100 mt-1"
                  style={{ 
                    zIndex: 1000,
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {suggestions.map((item, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action"
                      onClick={() =>
                        handleSelection(item.symbol, item.description)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {item.symbol} - {item.description}
                    </li>
                  ))}
                </ul>
              )}
            </Col>
            <Col xs={6}>
              <Form.Label>Symbol Name</Form.Label>
              <Form.Control
                type="symbol name"
                disabled
                value={symbolName}
                onChange={(e) => setSymbolName(e.target.value)}
              ></Form.Control>
            </Col>
          </Row>

          <Row>
            <Col>
              <Form.Group controlId="name">
                <Form.Label>Ladder Name</Form.Label>
                <Form.Control
                  type="name"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                ></Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <h2>Type</h2>
            <hr></hr>
            <Col xs={6}>
              <Form.Group controlId="type">
                <InputGroup className="mb-3">
                  <Form.Check
                    inline
                    label="Fixed"
                    value="Fixed"
                    name="type"
                    type="radio"
                    checked={type === "Fixed"}
                    id={`inline-radio-1`}
                    onChange={(e) => setType(e.target.value)}
                    disabled={typeLocked || market === "Crypto"}
                  />
                  <Form.Check
                    inline
                    label="Percentage"
                    value="Percentage"
                    name="type"
                    type="radio"
                    checked={type === "Percentage"}
                    id={`inline-radio-2`}
                    onChange={(e) => setType(e.target.value)}
                    disabled={typeLocked}
                  />
                  <Form.Check
                    inline
                    label="OTOCO"
                    value="OTOCO"
                    name="type"
                    type="radio"
                    checked={type === "OTOCO"}
                    id={`inline-radio-3`}
                    onChange={(e) => setType(e.target.value)}
                    disabled={typeLocked || market === "Crypto"}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <h2>Limits</h2>
            <hr></hr>
            <Col xs={6}>
              <Form.Group controlId="budget">
                <Form.Label>Ladder Budget</Form.Label>
                <br></br>
                <Form.Text> Ladder debt limit </Form.Text>
                <InputGroup className="mb-3">
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step={10}
                    min={0}
                    placeholder="Enter budget"
                    value={budget}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only update if it's empty or a valid whole number
                      if (value === "" || Number.isInteger(Number(value))) {
                        setBudget(value === "" ? "" : Number(value)); // store as number or empty string
                      }
                    }}
                  ></Form.Control>
                  <InputGroup.Text>.00</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="gap">
                <Form.Label>Gap</Form.Label>
                <br></br>
                <Form.Text> How often the Buy Trade is triggered </Form.Text>
                <InputGroup className="mb-3">
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Enter gap"
                    value={gap}
                    onChange={(e) => setGap(e.target.value)}
                  ></Form.Control>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col xs={6}>
              <Form.Group controlId="cap">
                <Form.Label>Stock Price Cap </Form.Label>
                <br></br>
                <Form.Text>
                  {" "}
                  Make sure to set this above the symbol price
                </Form.Text>
                {type === "Percentage" && market === "Stocks" && (
                  <>
                    <br></br>
                    <Form.Text> Must be more than Amount Per Trade</Form.Text>
                  </>
                )}
                <InputGroup className="mb-3">
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Enter cap"
                    value={
                      (cap > amount_per_trade && market === "Stocks") ||
                      market === "Crypto"
                        ? cap
                        : amount_per_trade
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only update if it's empty or a valid whole number
                      if (value === "" || Number.isInteger(Number(value))) {
                        setCap(value === "" ? "" : Number(value)); // store as number or empty string
                      }
                    }}
                  ></Form.Control>
                  <InputGroup.Text>.00</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col>
              <Form.Group controlId="shares_per_trade">
                <Form.Label>Shares Per Trade (SPT)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter shares per trade"
                  value={
                    type === "Percentage" && market === "Stocks"
                      ? 0.0
                      : shares_per_trade
                  }
                  disabled={type === "Percentage"}
                  onChange={(e) => setSharesPerTrade(e.target.value)}
                ></Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <h2>Pricing</h2>
          <hr></hr>

          <Fade in={type === "Fixed" && priceVisible} unmountOnExit>
            <Row
              className={`mt-3 transition-fade ${
                type === "Fixed" ? "show" : ""
              }`}
            >
              <Col>
                <Form.Label>Fixed</Form.Label>
                <Form.Group controlId="profit_per_trade">
                  <Form.Label>Profit Per Trade (PPT)</Form.Label>
                  <br></br>
                  <Form.Text>
                    {" "}
                    Buy_price + Profit Per Trade = Sell Price{" "}
                  </Form.Text>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      placeholder="Enter profit per trade"
                      value={profit_per_trade}
                      onChange={(e) => setProfitPerTrade(e.target.value)}
                      disabled={
                        market === "Crypto" ||
                        type === "Percentage" ||
                        type === "OTOCO"
                      }
                    ></Form.Control>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Fade>
          <Fade in={type === "Percentage" && priceVisible} unmountOnExit>
            <Row
              className={`mt-3 transition-fade ${
                type === "Percentage" ? "show" : ""
              }`}
            >
              <Form.Label>Percent of Amount Per Trade</Form.Label>
              <Col className="border-end">
                <Form.Group controlId="percent_per_trade">
                  <Form.Label>Percent Per Trade</Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="number"
                      placeholder="Enter Percent Per Trade"
                      value={percent_per_trade}
                      onChange={(e) => setPercentPerTrade(Math.floor(e.target.value))}
                      disabled={type === "Fixed" || type === "OTOCO"}
                    ></Form.Control>
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="amount_per_trade">
                  <Form.Label>Amount Per Trade</Form.Label>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      placeholder="Enter Amount Per Trade"
                      value={amount_per_trade}
                      onChange={(e) => setAmountPerTrade(Math.floor(e.target.value))}
                      step={1}
                      disabled={type === "Fixed" || type === "OTOCO"}
                    ></Form.Control>
                    <InputGroup.Text>.00</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Fade>
          <Fade in={type === "OTOCO" && priceVisible} unmountOnExit>
            <Row
              className={`mt-3 transition-fade ${
                type === "OTOCO" ? "show" : ""
              }`}
            >
              <Form.Label>OTOCO</Form.Label>
              <Col className="border-end">
                <Form.Group controlId="limit_price_in_percentage">
                  <Form.Label>Limit Price in Percentage</Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="number"
                      placeholder="Enter limit price in percentage"
                      value={limit_price_in_percentage}
                      onChange={(e) =>
                        setLimitPriceInPercentage(Math.floor(e.target.value))
                      }
                      disabled={
                        market === "Crypto" ||
                        type === "Fixed" ||
                        type === "Percentage"
                      }
                    ></Form.Control>
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="stop_price_in_percentage">
                  <Form.Label>Stop Price in Percentage</Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="number"
                      placeholder="Enter stop price in percentage"
                      value={stop_price_in_percentage}
                      onChange={(e) => setStopPriceInPercentage(Math.floor(e.target.value))}
                      disabled={
                        market === "Crypto" ||
                        type === "Fixed" ||
                        type === "Percentage"
                      }
                    ></Form.Control>
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Fade>

          <Row>
            <Col>
              <Button className="my-3" type="submit" variant="primary">
                Update Ladder
              </Button>
            </Col>
            <Col></Col>
          </Row>
        </Form>
      </FormContainer>
    </div>
  );
}

export default LadderEditScreen;
