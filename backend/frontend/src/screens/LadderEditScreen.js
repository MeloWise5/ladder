import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Fade, Form, Row, Col, InputGroup } from "react-bootstrap";
import axios from "axios";

import Loader from "../components/Loader";
import Message from "../components/Message";
import {
  detailsLadder,
  updateLadder,
  deleteLadder,
  listUsersLadders,
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
  const [buffer_52_week, setBuffer52Week] = useState(0);
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
  const [trending, setTrending] = useState("RUN_AWAY"); 
  const [type, setType] = useState("");
  const [typeLocked, setTypeLocked] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [pennyStockWarning, setPennyStockWarning] = useState(false);
  const [stockPrice, setStockPrice] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);

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
      dispatch(listUsersLadders());
      const from = "/";
      navigate(from);
    }
    if (deleteSuccess) {
      dispatch({ type: LADDER_DELETE_RESET });
      dispatch(listUsersLadders());
      const from = "/";
      navigate(from);
    }

    const ladderId = Number(params.id); //all items from the url are strings

    if (ladder?.name && ladder?._id === ladderId) {
      setName(ladder.name);
      setAmountPerTrade(ladder?.amount_per_trade || 0);
      setBudget(ladder?.budget || 0);
      setBuffer52Week(ladder?.buffer_52_week || 0);
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
      setTrending(ladder?.trending || "RUN_AWAY");
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
        buffer_52_week,
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
        trending,
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

        // Tradier returns a single object (not array) when there's only 1 result,
        // and returns null for securities when there are no results.
        const raw = response?.data?.securities?.security ?? [];
        const list = Array.isArray(raw) ? raw : [raw];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (error) {
        console.error("Symbol lookup error:", error?.response?.status, error?.message);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelection = async (sym, name) => {
    setSymbol(sym);
    setSymbolName(name);
    setShowSuggestions(false);
    setPennyStockWarning(false);
    setStockPrice(null);
    setStockQuote(null);

    if (market === "Stocks") {
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const response = await axios.get(`/api/ladders/quotet/${sym}/`, config);
        const price = response.data.price;
        setStockPrice(price);
        setStockQuote(response.data);
        if (price > 0 && price < 5) {
          setPennyStockWarning(true);
        }
      } catch (error) {
        console.error("Error fetching stock quote:", error);
      }
    }
  };
  const handleMarketChange = (e) => {
    setMarket(e.target.value);
    setSymbol("");
    setSymbolName("");
    setSuggestions([]);
    setShowSuggestions(false);
    setType("Percentage");
    setPennyStockWarning(false);
    setStockPrice(null);
    setStockQuote(null);
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
    <div className="ladder-edit-layout">
      {loadingLadderUpdate && <Loader />}
      {errorLadderUpdate && <Message variant="danger">{errorLadderUpdate}</Message>}
      {loadingLadder && <Loader />}
      {errorLadder && <Message variant="danger">{errorLadder}</Message>}

      <div className="ladder-edit-header">
        <button className="ladder-edit-back" onClick={() => navigate(location.state?.from || '/')}>← Back</button>
        <span className="ladder-edit-title">Edit Ladder</span>
        <button type="button" className="admin-action-btn admin-action-btn--delete" onClick={() => deleteHandler(ladder._id)}>
          <i className="fas fa-trash" />
        </button>
      </div>

      <div className="ladder-edit-card">
        <Form onSubmit={submitHandler}>

          <Row className="mb-3">
            <Col xs={3} md={2}>
              <Form.Label className="ladder-edit-label">Enable</Form.Label>
              <Form.Check type="switch" checked={enable} onChange={(e) => setEnable(e.target.checked)} className="admin-toggle" />
            </Col>
            <Col xs={9} md={5}>
              <Form.Label className="ladder-edit-label">Trading Direction</Form.Label>
              <div className="ladder-radio-group">
                <Form.Check inline label="Buy" value="Buy" name="direction" type="radio" checked={direction === "Buy"} id="dir-buy" onChange={(e) => setDirection(e.target.value)} />
                <Form.Check inline label="Sell" value="Sell" name="direction" type="radio" checked={direction === "Sell"} id="dir-sell" onChange={(e) => setDirection(e.target.value)} />
                <Form.Check inline label="Both" value="Both" name="direction" type="radio" checked={direction === "Both"} id="dir-both" onChange={(e) => setDirection(e.target.value)} />
              </div>
            </Col>
          </Row>

          <div className="ladder-section-header">Market</div>
          <Row className="mb-3">
            <Col>
              <div className="ladder-radio-group">
                <Form.Check inline label="Stocks" value="Stocks" name="market" type="radio" checked={market === "Stocks"} disabled={marketLocked} id="mkt-stocks" onChange={handleMarketChange} />
                <Form.Check inline label="Crypto" value="Crypto" name="market" type="radio" checked={market === "Crypto"} disabled={marketLocked} id="mkt-crypto" onChange={handleMarketChange} />
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={6} className="position-relative">
              <Form.Label className="ladder-edit-label">Symbol</Form.Label>
              <Form.Control type="text" placeholder="Enter Symbol" value={symbol} disabled={symbolLocked} onChange={handleLookupSymbol} className="dark-input" />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="ladder-suggestions">
                  {suggestions.map((item, index) => (
                    <li key={index} className="ladder-suggestion-item" onClick={() => handleSelection(item.symbol, item.description)}>
                      {item.symbol} — {item.description}
                    </li>
                  ))}
                </ul>
              )}
            </Col>
            <Col xs={6}>
              <Form.Label className="ladder-edit-label">Symbol Name</Form.Label>
              <Form.Control type="text" disabled value={symbolName} onChange={(e) => setSymbolName(e.target.value)} className="dark-input" />
            </Col>
          </Row>

          {stockQuote && market === "Stocks" && (
            <div className="stock-quote-strip mb-3">
              <div className="stock-quote-price">
                ${Number(stockQuote.price).toFixed(2)}
                {stockQuote.change != null && (
                  <span className={`stock-quote-change ${stockQuote.change >= 0 ? 'up' : 'down'}`}>
                    &nbsp;{stockQuote.change >= 0 ? '+' : ''}{Number(stockQuote.change).toFixed(2)}
                    &nbsp;({stockQuote.change_percentage >= 0 ? '+' : ''}{Number(stockQuote.change_percentage).toFixed(2)}%)
                  </span>
                )}
              </div>
              <div className="stock-quote-grid">
                {stockQuote.open    != null && <div className="stock-quote-cell"><span>Open</span><span>${Number(stockQuote.open).toFixed(2)}</span></div>}
                {stockQuote.high    != null && <div className="stock-quote-cell"><span>High</span><span>${Number(stockQuote.high).toFixed(2)}</span></div>}
                {stockQuote.low     != null && <div className="stock-quote-cell"><span>Low</span><span>${Number(stockQuote.low).toFixed(2)}</span></div>}
                {stockQuote.bid     != null && <div className="stock-quote-cell"><span>Bid</span><span>${Number(stockQuote.bid).toFixed(2)}</span></div>}
                {stockQuote.ask     != null && <div className="stock-quote-cell"><span>Ask</span><span>${Number(stockQuote.ask).toFixed(2)}</span></div>}
                {stockQuote.volume  != null && <div className="stock-quote-cell"><span>Volume</span><span>{Number(stockQuote.volume).toLocaleString()}</span></div>}
                {stockQuote.week52_high != null && <div className="stock-quote-cell"><span>52W High</span><span>${Number(stockQuote.week52_high).toFixed(2)}</span></div>}
                {stockQuote.week52_low  != null && <div className="stock-quote-cell"><span>52W Low</span><span>${Number(stockQuote.week52_low).toFixed(2)}</span></div>}
              </div>
            </div>
          )}

          <Row className="mb-3">
            <Col>
              <Form.Label className="ladder-edit-label">Ladder Name</Form.Label>
              <Form.Control type="text" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} className="dark-input" />
            </Col>
          </Row>

          <div className="ladder-section-header">Type</div>
          <Row className="mb-3">
            <Col>
              <div className="ladder-radio-group">
                <Form.Check inline label="Fixed" value="Fixed" name="type" type="radio" checked={type === "Fixed"} id="type-fixed" onChange={(e) => setType(e.target.value)} disabled={typeLocked || market === "Crypto"} />
                <Form.Check inline label="Percentage" value="Percentage" name="type" type="radio" checked={type === "Percentage"} id="type-pct" onChange={(e) => setType(e.target.value)} disabled={typeLocked} />
                <Form.Check inline label="OTOCO" value="OTOCO" name="type" type="radio" checked={type === "OTOCO"} id="type-otoco" onChange={(e) => setType(e.target.value)} disabled={typeLocked || market === "Crypto"} />
              </div>
            </Col>
          </Row>

          <div className="ladder-section-header">Limits</div>
          <Row className="mb-3">
            <Col xs={6}>
              <Form.Label className="ladder-edit-label">Ladder Budget <span className="ladder-edit-hint">Ladder debt limit</span></Form.Label>
              <InputGroup>
                <InputGroup.Text className="dark-input-addon">$</InputGroup.Text>
                <Form.Control type="number" step={10} min={0} placeholder="Enter budget" value={budget} className="dark-input"
                  onChange={(e) => { const v = e.target.value; if (v === "" || Number.isInteger(Number(v))) setBudget(v === "" ? "" : Number(v)); }}
                />
                <InputGroup.Text className="dark-input-addon">.00</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col>
              <Form.Label className="ladder-edit-label">
                Gap <span className="ladder-edit-hint">How often the Buy Trade triggers</span>
                {pennyStockWarning && (
                  <span style={{ color: "#ffaa00", fontWeight: "bold", marginLeft: "8px" }}>⚠ Penny Stock</span>
                )}
              </Form.Label>
              {pennyStockWarning && (
                <div style={{
                  color: "#7a5c00",
                  backgroundColor: "#2a2200",
                  border: "1px solid #ffaa00",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  marginBottom: "8px",
                  fontSize: "0.82rem",
                  lineHeight: "1.4",
                }}>
                  <strong style={{ color: "#ffaa00" }}>⚠ Penny Stock Restriction:</strong>{" "}
                  <span style={{ color: "#e0c97a" }}>This stock is ${stockPrice?.toFixed(2)}. Tradier limits buy orders to within 10% of price.</span>{" "}
                  <strong style={{ color: "#ffaa00" }}>GAP cannot exceed $0.10.</strong>
                </div>
              )}
              <InputGroup>
                <InputGroup.Text className="dark-input-addon">$</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Enter gap"
                  value={gap}
                  className="dark-input"
                  step={pennyStockWarning ? 0.01 : 0.1}
                  max={pennyStockWarning ? 0.10 : undefined}
                  style={pennyStockWarning ? { borderColor: "#ffaa00" } : {}}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (pennyStockWarning && val > 0.10) {
                      setGap(0.10);
                    } else {
                      setGap(e.target.value);
                    }
                  }}
                />
              </InputGroup>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={6}>
              <Form.Label className="ladder-edit-label">
                Stock Price Cap
                <span className="ladder-edit-hint"> Must be above symbol price{type === "Percentage" && market === "Stocks" && " · Must exceed Amount Per Trade"}</span>
              </Form.Label>
              <InputGroup>
                <InputGroup.Text className="dark-input-addon">$</InputGroup.Text>
                <Form.Control type="number" step="1" min="0" placeholder="Enter cap" className="dark-input"
                  value={(cap > amount_per_trade && market === "Stocks") || market === "Crypto" ? cap : amount_per_trade}
                  onChange={(e) => { const v = e.target.value; if (v === "" || Number.isInteger(Number(v))) setCap(v === "" ? "" : Number(v)); }}
                />
                <InputGroup.Text className="dark-input-addon">.00</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col>
              <Form.Label className="ladder-edit-label">Shares Per Trade (SPT)</Form.Label>
              {type === "Percentage" ? (
                <div className="dark-input form-control spt-formula-display">
                  {stockPrice && amount_per_trade > 0 ? (
                    <span className="spt-formula-text">
                      <span className="spt-formula-val">${Number(amount_per_trade).toLocaleString()}</span>
                      <span className="spt-formula-op">&nbsp;÷&nbsp;</span>
                      <span className="spt-formula-val">${Number(stockPrice).toFixed(2)}</span>
                      <span className="spt-formula-op">&nbsp;=&nbsp;</span>
                      <span className="spt-formula-result">{Math.floor(amount_per_trade / stockPrice)} shares</span>
                      <br />
                      <span className="spt-formula-hint">Calculated at trade time · rounded down</span>
                    </span>
                  ) : (
                    <span className="spt-formula-text">
                      <span className="spt-formula-op">Amount Per Trade&nbsp;÷&nbsp;Stock Price&nbsp;=&nbsp;SPT</span>
                      <br />
                      <span className="spt-formula-hint">{stockPrice ? 'Set an Amount Per Trade above' : 'Select a symbol to preview'}</span>
                    </span>
                  )}
                </div>
              ) : (
                <Form.Control type="number" placeholder="Enter shares per trade" className="dark-input"
                  value={shares_per_trade}
                  onChange={(e) => setSharesPerTrade(e.target.value)}
                />
              )}
            </Col>
          </Row>

          <div className="ladder-section-header">Pricing</div>

          <Fade in={type === "Fixed" && priceVisible} unmountOnExit>
            <Row className="mb-3">
              <Col>
                <Form.Label className="ladder-edit-label">Profit Per Trade (PPT) <span className="ladder-edit-hint">Buy price + PPT = Sell Price</span></Form.Label>
                <InputGroup>
                  <InputGroup.Text className="dark-input-addon">$</InputGroup.Text>
                  <Form.Control type="number" placeholder="Enter profit per trade" value={profit_per_trade} className="dark-input"
                    onChange={(e) => setProfitPerTrade(e.target.value)}
                    disabled={market === "Crypto" || type === "Percentage" || type === "OTOCO"}
                  />
                </InputGroup>
              </Col>
            </Row>
          </Fade>

          <Fade in={type === "Percentage" && priceVisible} unmountOnExit>
            <Row className="mb-3">
              <Col className="border-end">
                <Form.Label className="ladder-edit-label">Percent Per Trade</Form.Label>
                <InputGroup>
                  <Form.Control type="number" placeholder="Enter Percent Per Trade" value={percent_per_trade} className="dark-input"
                    onChange={(e) => setPercentPerTrade(Math.floor(e.target.value))}
                    disabled={type === "Fixed" || type === "OTOCO"}
                  />
                  <InputGroup.Text className="dark-input-addon">%</InputGroup.Text>
                </InputGroup>
              </Col>
              <Col>
                <Form.Label className="ladder-edit-label">Amount Per Trade</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="dark-input-addon">$</InputGroup.Text>
                  <Form.Control type="number" placeholder="Enter Amount Per Trade" value={amount_per_trade} className="dark-input"
                    onChange={(e) => setAmountPerTrade(Math.floor(e.target.value))}
                    step={1}
                    disabled={type === "Fixed" || type === "OTOCO"}
                  />
                  <InputGroup.Text className="dark-input-addon">.00</InputGroup.Text>
                </InputGroup>
              </Col>
            </Row>
          </Fade>

          <Fade in={type === "OTOCO" && priceVisible} unmountOnExit>
            <Row className="mb-3">
              <Col className="border-end">
                <Form.Label className="ladder-edit-label">Limit Price in Percentage</Form.Label>
                <InputGroup>
                  <Form.Control type="number" placeholder="Enter limit price in percentage" value={limit_price_in_percentage} className="dark-input"
                    onChange={(e) => setLimitPriceInPercentage(Math.floor(e.target.value))}
                    disabled={market === "Crypto" || type === "Fixed" || type === "Percentage"}
                  />
                  <InputGroup.Text className="dark-input-addon">%</InputGroup.Text>
                </InputGroup>
              </Col>
              <Col>
                <Form.Label className="ladder-edit-label">Stop Price in Percentage</Form.Label>
                <InputGroup>
                  <Form.Control type="number" placeholder="Enter stop price in percentage" value={stop_price_in_percentage} className="dark-input"
                    onChange={(e) => setStopPriceInPercentage(Math.floor(e.target.value))}
                    disabled={market === "Crypto" || type === "Fixed" || type === "Percentage"}
                  />
                  <InputGroup.Text className="dark-input-addon">%</InputGroup.Text>
                </InputGroup>
              </Col>
            </Row>
          </Fade>

          <div className="ladder-section-header">Features</div>

          <div className="ladder-subsection-header">52 Week Buffer</div>
          <Fade in={market === "Stocks" && priceVisible} unmountOnExit>
            <Row className="mb-3">
              <Col>
                <p className="ladder-edit-desc">
                  For stocks only. Stops the ladder from setting buy trades if the price gets within this buffer window — preventing 52-week high debt. Recommended: at least 3% to account for volatility.
                </p>
              </Col>
              <Col>
                <Form.Label className="ladder-edit-label">52 Week Buffer</Form.Label>
                <InputGroup>
                  <Form.Control type="number" placeholder="Enter buffer %" value={buffer_52_week} className="dark-input"
                    onChange={(e) => { const oneDigit = e.target.value.replace(/\D/g, "").slice(0, 1); setBuffer52Week(oneDigit === "" ? 0 : Number(oneDigit)); }}
                    min={0} max={9} step={1} disabled={market === "Crypto"}
                  />
                  <InputGroup.Text className="dark-input-addon">%</InputGroup.Text>
                </InputGroup>
              </Col>
            </Row>
          </Fade>

          <div className="ladder-subsection-header">Trending</div>
          <Fade in={market === "Stocks" && priceVisible} unmountOnExit>
            <Row className="mb-3">
              <Col>
                <p className="ladder-edit-desc">
                  For stocks only. Stops placing Buy Trades when the 24-hour % change is negative. "Run Away Train" never stops until the budget is exhausted.
                </p>
              </Col>
              <Col>
                <Form.Label className="ladder-edit-label">Trending</Form.Label>
                <Form.Select value={trending} onChange={(e) => setTrending(e.target.value)} disabled={market === "Crypto"} className="dark-input">
                  <option value="RUN_AWAY">Run Away Train</option>
                  <option value="HOUR_24">24 Hour % Change</option>
                </Form.Select>
              </Col>
            </Row>
          </Fade>

          <div className="ladder-edit-footer">
            <button type="submit" className="prof-btn ladder-save-btn">Update Ladder</button>
          </div>

        </Form>
      </div>
    </div>
  );
}

export default LadderEditScreen;
