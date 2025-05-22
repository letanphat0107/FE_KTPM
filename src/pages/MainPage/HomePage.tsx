import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Row,
  Col,
  Dropdown,
  Card,
  Container,
} from "react-bootstrap";
import RoomList from "../../components/slider/RoomList";
import HotListings from "../ProductList/HotListings";
import ProvinceListings from "../../components/common/ProvinceListings ";
import { FaDollarSign, FaMap, FaSearch } from "react-icons/fa";
import addressAPI from "../../apis/address.api";
import { District, Province, Ward } from "../../types/address.type";
import roomApi from "../../apis/room.api";

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("tat-ca");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");

  const [priceRange, setPriceRange] = useState("all");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [areaRange, setAreaRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const trainAI = async () => {
  //     try {
  //       const response = await roomApi.aiTrainMode();
  //     } catch (error) {
  //       console.error("Error train:", error);
  //     }
  //   };

  //   trainAI();
  // })

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      if (localStorage.getItem("provinces")) {
        const cachedProvinces = localStorage.getItem("provinces");
        if (cachedProvinces) {
          setProvinces(JSON.parse(cachedProvinces) as Province[]);
          return;
        }
      }
      try {
        setLoading(true);
        const response = await addressAPI.getProvinces();
        if (response.data && response.data.data && response.data.data.data) {
          setProvinces(response.data.data.data as Province[]);
          localStorage.setItem(
            "provinces",
            JSON.stringify(response.data.data.data as Province[])
          );
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        return;
      }

      try {
        setLoading(true);
        const response = await addressAPI.getDistricts(selectedProvince);
        if (response.data && response.data.data && response.data.data.data) {
          setDistricts(response.data.data.data as District[]);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
    // Reset dependent fields
    setSelectedDistrict("");
    setSelectedWard("");
    setWards([]);
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) {
        setWards([]);
        return;
      }

      try {
        setLoading(true);
        const response = await addressAPI.getWards(selectedDistrict);
        if (response.data && response.data.data && response.data.data.data) {
          setWards(response.data.data.data as Ward[]);
        }
      } catch (error) {
        console.error("Error fetching wards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
    // Reset dependent field
    setSelectedWard("");
  }, [selectedDistrict]);

  // Reset location selections
  const resetLocationSelections = () => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
  };

  const handleAreaRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAreaRange(e.target.id);
  };

  const areaLabelMap: Record<string, string> = {
    "all-area": "Tất cả diện tích",
    "under-20": "Dưới 20 m²",
    "20-40": "20m² - 40 m²",
    "40-60": "40m² - 60 m²",
    "60-80": "60m² - 80 m²",
    "80-plus": "Trên 80 m²",
  };

  const resetAreaFilters = () => {
    setAreaRange("all-area");
  };

  const priceLabelMap: Record<string, string> = {
    all: "Tất cả mức giá",
    "under-1m": "Dưới 1 triệu",
    "1-10m": "1 - 10 triệu",
    "10-30m": "10 - 30 triệu",
    "30-50m": "30 - 50 triệu",
    "50m-plus": "Trên 50 triệu",
    "100m-plus": "Trên 100 triệu",
  };

  // Lấy room type từ selected category
  const getRoomTypeFromCategory = () => {
    switch (selectedCategory) {
      case "nha-tro-phong-tro":
        return "BOARDING_HOUSE";
      case "nha-nguyen-can":
        return "WHOLE_HOUSE";
      case "can-ho-chung-cu":
        return "APARTMENT";
      default:
        return null; // Nếu là "tất cả"
    }
  };

  // Chuyển đổi areaRange sang định dạng để lọc
  const getAreaRangeParam = () => {
    switch (areaRange) {
      case "under-20":
        return "0-20";
      case "20-40":
        return "20-40";
      case "40-60":
        return "40-60";
      case "60-80":
        return "60-80";
      case "80-plus":
        return "80-1000";
      default:
        return null;
    }
  };

  // Chuyển đổi priceRange sang định dạng để lọc
  const getPriceRangeParam = () => {
    // Sử dụng minPrice và maxPrice nếu đã nhập
    if (minPriceInput || maxPriceInput) {
      return {
        minPrice: minPriceInput
          ? parseFloat(minPriceInput) * 1000000
          : undefined,
        maxPrice: maxPriceInput
          ? parseFloat(maxPriceInput) * 1000000
          : undefined,
      };
    }

    // Nếu không, sử dụng priceRange đã chọn
    switch (priceRange) {
      case "under-1m":
        return { minPrice: 0, maxPrice: 1000000 };
      case "1-10m":
        return { minPrice: 1000000, maxPrice: 10000000 };
      case "10-30m":
        return { minPrice: 10000000, maxPrice: 30000000 };
      case "30-50m":
        return { minPrice: 30000000, maxPrice: 50000000 };
      case "50m-plus":
        return { minPrice: 50000000, maxPrice: undefined };
      case "100m-plus":
        return { minPrice: 100000000, maxPrice: undefined };
      default:
        return { minPrice: undefined, maxPrice: undefined };
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = () => {
    const roomType = getRoomTypeFromCategory();
    const areaRangeParam = getAreaRangeParam();
    const { minPrice, maxPrice } = getPriceRangeParam();

    const searchParams = {
      query: searchQuery,
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard,
      minPrice,
      maxPrice,
      areaRange: areaRangeParam,
      roomType,
    };

    // Lưu searchParams vào localStorage
    localStorage.setItem("searchParams", JSON.stringify(searchParams));

    // Chuyển hướng người dùng đến trang category phù hợp
    if (roomType) {
      // Nếu đã chọn một loại phòng cụ thể
      navigate(`/category/${selectedCategory}`);
    } else {
      // Nếu chọn "tất cả"
      navigate("/category/tat-ca");
    }
  };

  return (
    <div>
      <div
        className="banner position-relative"
        style={{
          background: "linear-gradient(to right, #00052e, #010c3a, #1a237e)",
          backgroundImage:
            "url('https://tromoi.com/frontend/home/images/banner_default.jpg')",
          backgroundSize: "cover",
          padding: "50px 0 20px",
          overflow: "visible",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Container>
          {/* QC 01 */}
          <Row className="align-items-center">
            <Col md={7} className="text-white px-4">
              <h1
                className="fw-bold"
                style={{ fontSize: "3rem", lineHeight: 1.2 }}
              >
                TÌM NHANH, KIẾM DỄ
              </h1>
              <h1
                className="fw-bold mb-4"
                style={{ fontSize: "3rem", lineHeight: 1.2 }}
              >
                TRỌ MỚI TOÀN QUỐC
              </h1>
              <p className="mb-4" style={{ fontSize: "1.1rem" }}>
                Trang thông tin và cho thuê phòng trọ nhanh chóng, hiệu quả với
                <br />
                hơn 500 tin đăng mới và 30.000 lượt xem mỗi ngày
              </p>
            </Col>
          </Row>

          <div className="">
            {/* Filter Section */}
            <Row className="mb-0 ">
              <Col>
                <div className="d-flex bg-transparent">
                  <Button
                    variant="primary"
                    className="d-inline-block py-3  border-0 fw-bold"
                    onClick={() => setSelectedCategory("tat-ca")}
                    style={{
                      backgroundColor:
                        selectedCategory === "tat-ca" ? "#0046a8" : "#e5ecf6",
                      color:
                        selectedCategory === "tat-ca" ? "#ffffff" : "#0046a8",
                      padding: "0 60px",
                      borderRadius: "8px 8px 0 0",
                      outline: "none",
                      boxShadow: "none",
                    }}
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant="light"
                    className="d-inline-block py-3 border-0 fw-bold"
                    onClick={() => setSelectedCategory("nha-tro-phong-tro")}
                    style={{
                      backgroundColor:
                        selectedCategory === "nha-tro-phong-tro"
                          ? "#0046a8"
                          : "#e5ecf6",
                      color:
                        selectedCategory === "nha-tro-phong-tro"
                          ? "#ffffff"
                          : "#0046a8",
                      marginLeft: "2px",
                      padding: "0 60px",
                      borderRadius: "8px 8px 0 0",
                      outline: "none",
                      boxShadow: "none",
                    }}
                  >
                    Nhà trọ, phòng trọ
                  </Button>
                  <Button
                    variant="light"
                    className="d-inline-block py-3 border-0 fw-bold"
                    onClick={() => setSelectedCategory("nha-nguyen-can")}
                    style={{
                      backgroundColor:
                        selectedCategory === "nha-nguyen-can"
                          ? "#0046a8"
                          : "#e5ecf6",
                      color:
                        selectedCategory === "nha-nguyen-can"
                          ? "#ffffff"
                          : "#0046a8",
                      marginLeft: "2px",
                      padding: "0 60px",
                      borderRadius: "8px 8px 0 0",
                      outline: "none",
                      boxShadow: "none",
                    }}
                  >
                    Nhà nguyên căn
                  </Button>
                  <Button
                    variant="light"
                    className="d-inline-block py-3  border-0 fw-bold"
                    onClick={() => setSelectedCategory("can-ho-chung-cu")}
                    style={{
                      backgroundColor:
                        selectedCategory === "can-ho-chung-cu"
                          ? "#0046a8"
                          : "#e5ecf6",
                      color:
                        selectedCategory === "can-ho-chung-cu"
                          ? "#ffffff"
                          : "#0046a8",
                      marginLeft: "2px",
                      padding: "0 60px",
                      borderRadius: "8px 8px 0 0",
                      outline: "none",
                      boxShadow: "none",
                    }}
                  >
                    Căn hộ
                  </Button>
                </div>
              </Col>
            </Row>
            {/* Filter Inputs */}
            <Row className="g-0 position-relative" style={{ zIndex: 1000 }}>
              <Col>
                <div
                  className="d-flex p-2 align-items-stretch"
                  style={{
                    backgroundColor: "#0046a8",
                    borderRadius: "0 0 8px 8px",
                  }}
                >
                  {/* Input: Ban muon tim tro o dau */}
                  <div
                    className="flex-grow-1 px-1"
                    style={{ maxWidth: "270px" }}
                  >
                    <div className="input-group rounded-3 overflow-hidden h-100">
                      <span className="input-group-text bg-white border-0 h-100 d-flex align-items-center">
                        <FaSearch color="#0046a8" />
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Bạn muốn tìm trọ ở đâu?"
                        className="border-0 py-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Dia diem */}
                  <div
                    className="flex-grow-1 px-1"
                    style={{ maxWidth: "270px" }}
                  >
                    <div className="input-group rounded-3 h-100">
                      <div className="dropdown w-100 h-100 position-static">
                        <button
                          className="btn bg-white text-secondary border-0 w-100 h-100 text-start d-flex align-items-center justify-content-between dropdown-toggle"
                          type="button"
                          id="dropdownLocation"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <div className="d-flex align-items-center">
                            <span className="input-group-text bg-white border-0 p-0 me-2">
                              <FaMap color="#0046a8" />
                            </span>
                            {selectedWard ? (
                              <span
                                className="text-truncate d-inline-block"
                                style={{
                                  maxWidth: "200px", // hoặc bạn set cố định phù hợp với thiết kế
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {(wards.find((w) => w.code === selectedWard)
                                  ?.name || "") +
                                  ", " +
                                  (districts.find(
                                    (d) => d.code === selectedDistrict
                                  )?.name || "") +
                                  ", " +
                                  (provinces.find(
                                    (p) => p.code === selectedProvince
                                  )?.name || "")}
                              </span>
                            ) : selectedDistrict ? (
                              <span
                                className="text-truncate d-inline-block"
                                style={{
                                  maxWidth: "200px", // hoặc bạn set cố định phù hợp với thiết kế
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {(districts.find(
                                  (d) => d.code === selectedDistrict
                                )?.name || "") +
                                  ", " +
                                  (provinces.find(
                                    (p) => p.code === selectedProvince
                                  )?.name || "")}
                              </span>
                            ) : selectedProvince ? (
                              <span
                                className="text-truncate d-inline-block"
                                style={{
                                  maxWidth: "200px", // hoặc bạn set cố định phù hợp với thiết kế
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {provinces.find(
                                  (p) => p.code === selectedProvince
                                )?.name || ""}
                              </span>
                            ) : (
                              <span>Địa điểm</span>
                            )}
                          </div>
                        </button>
                        <div
                          className="dropdown-menu p-0 w-100"
                          style={{ zIndex: 1050 }}
                          aria-labelledby="dropdownLocation"
                        >
                          <div className="location-form p-0">
                            <div className="mb-0">
                              <Form.Select
                                value={selectedProvince}
                                onChange={(e) => {
                                  setSelectedProvince(e.target.value);
                                  setSelectedDistrict("");
                                  setSelectedWard("");
                                }}
                                className="border-0 border-bottom rounded-0 py-3"
                                disabled={loading}
                              >
                                <option value="">Chọn Tỉnh/TP...</option>
                                {Array.isArray(provinces) &&
                                  provinces.map((province, index) => (
                                    <option
                                      key={province.code || index}
                                      value={province.code}
                                    >
                                      {province.name_with_type}
                                    </option>
                                  ))}
                              </Form.Select>
                            </div>

                            <div className="mb-0">
                              <Form.Select
                                value={selectedDistrict}
                                onChange={(e) => {
                                  setSelectedDistrict(e.target.value);
                                  setSelectedWard("");
                                }}
                                className="border-0 border-bottom rounded-0 py-3"
                                disabled={!selectedProvince || loading}
                              >
                                <option value="">Quận/Huyện...</option>
                                {districts.map((district) => (
                                  <option
                                    key={district.id}
                                    value={district.code}
                                  >
                                    {district.name_with_type}
                                  </option>
                                ))}
                              </Form.Select>
                            </div>

                            <div className="mb-0">
                              <Form.Select
                                value={selectedWard}
                                onChange={(e) =>
                                  setSelectedWard(e.target.value)
                                }
                                className="border-0 border-bottom rounded-0 py-3"
                                disabled={!selectedDistrict || loading}
                              >
                                <option value="">Đường phố...</option>
                                {wards.map((ward) => (
                                  <option key={ward.id} value={ward.code}>
                                    {ward.name_with_type}
                                  </option>
                                ))}
                              </Form.Select>
                            </div>

                            <div className="d-flex justify-content-between p-2">
                              <Button
                                variant="link"
                                className="text-decoration-none d-flex align-items-center"
                                onClick={resetLocationSelections}
                              >
                                <i className="bi bi-arrow-repeat me-1"></i> Đặt
                                lại
                              </Button>
                              <Button onClick={handleSearch} variant="primary">
                                Tìm ngay
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Muc gia */}
                  <div
                    className="flex-grow-1 px-1 position-relative"
                    style={{ maxWidth: "270px" }}
                  >
                    <div className="input-group rounded-3 h-100">
                      <Dropdown className="w-100 h-100">
                        <Dropdown.Toggle className="bg-white text-secondary border-0 w-100 h-100 text-start d-flex align-items-center justify-content-between">
                          <span className="input-group-text bg-white border-0">
                            <FaDollarSign color="#0046a8" />
                          </span>
                          <span className="text-start w-100">
                            {minPriceInput || maxPriceInput
                              ? `Từ ${minPriceInput || "0"} → ${
                                  maxPriceInput || "∞"
                                } triệu`
                              : priceLabelMap[priceRange] || "Mức giá"}
                          </span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu
                          className="w-100 p-3"
                          style={{ zIndex: 1050 }}
                        >
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-3">
                              <div className="pe-2 flex-grow-1">
                                <Form.Control
                                  type="text"
                                  placeholder="Từ"
                                  className="rounded"
                                  value={minPriceInput}
                                  onChange={(e) => {
                                    setMinPriceInput(e.target.value);
                                    setPriceRange(""); // reset radio
                                  }}
                                />
                              </div>
                              <div className="px-2">→</div>
                              <div className="ps-2 flex-grow-1">
                                <Form.Control
                                  type="text"
                                  placeholder="Đến"
                                  className="rounded"
                                  value={maxPriceInput}
                                  onChange={(e) => {
                                    setMaxPriceInput(e.target.value);
                                    setPriceRange(""); // reset radio
                                  }}
                                />
                              </div>
                            </div>

                            {Object.entries(priceLabelMap).map(
                              ([key, label]) => (
                                <Form.Check
                                  type="radio"
                                  id={key}
                                  name="price-range"
                                  key={key}
                                  label={
                                    key === "all" ? (
                                      <span className="fw-bold">{label}</span>
                                    ) : (
                                      label
                                    )
                                  }
                                  checked={priceRange === key}
                                  onChange={() => {
                                    setPriceRange(key);
                                    setMinPriceInput("");
                                    setMaxPriceInput("");
                                  }}
                                  className="mb-2"
                                />
                              )
                            )}
                          </div>

                          <div className="d-flex justify-content-between p-2">
                            <Button
                              variant="link"
                              className="text-decoration-none d-flex align-items-center"
                              onClick={() => {
                                setMinPriceInput("");
                                setMaxPriceInput("");
                                setPriceRange("all");
                              }}
                            >
                              <i className="bi bi-arrow-repeat me-1"></i> Đặt
                              lại
                            </Button>
                            <Button onClick={handleSearch} variant="primary">
                              Tìm ngay
                            </Button>
                          </div>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>

                  {/* Dien tich */}
                  <div
                    className="flex-grow-1 px-1 position-relative"
                    style={{ maxWidth: "270px" }}
                  >
                    <div className="input-group rounded-3 h-100">
                      <Dropdown className="w-100 h-100">
                        <Dropdown.Toggle className="bg-white text-secondary border-0 w-100 h-100 text-start d-flex align-items-center justify-content-between">
                          <span className="input-group-text bg-white border-0">
                            <span style={{ color: "#0046a8" }}>m²</span>
                          </span>
                          <span className="text-start w-100">
                            {areaLabelMap[areaRange] || "Diện tích"}
                          </span>

                          <span>▼</span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu
                          className="w-100 p-3"
                          style={{ zIndex: 1050 }}
                        >
                          {Object.entries(areaLabelMap).map(
                            ([value, label]) => (
                              <Form.Check
                                key={value}
                                type="radio"
                                id={value}
                                name="area-range"
                                label={label}
                                checked={areaRange === value}
                                onChange={handleAreaRangeChange}
                                className="mb-2"
                              />
                            )
                          )}

                          <div className="d-flex justify-content-between p-2">
                            <Button
                              variant="link"
                              className="text-decoration-none d-flex align-items-center"
                              onClick={resetAreaFilters}
                            >
                              <i className="bi bi-arrow-repeat me-1"></i> Đặt
                              lại
                            </Button>
                            <Button onClick={handleSearch} variant="primary">
                              Tìm ngay
                            </Button>
                          </div>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                  {/* Button tim kiem */}
                  <div className="flex-shrink-0 px-1 d-flex align-items-stretch">
                    <Button
                      variant="danger"
                      className="py-2 px-4 border-0 rounded-3 fw-bold h-100"
                      style={{ backgroundColor: "#ff5a00" }}
                      onClick={handleSearch}
                    >
                      <FaSearch className="me-2" /> Tìm kiếm
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      {/* Banner Section with Images */}
      <Container className="mt-4" style={{ position: "relative", zIndex: 1 }}>
        <Row className="g-3 mb-5">
          <Col md={4}>
            <div className="bg-primary bg-opacity-10 rounded p-2 text-center">
              <img
                src="https://tromoi.com/frontend/home/images/banners/banner_tang_30.webp"
                alt="Promotion"
                className="img-fluid"
              />
            </div>
          </Col>
          <Col md={4}>
            <div className="bg-primary bg-opacity-10 rounded p-2 text-center">
              <img
                src="https://tromoi.com/frontend/home/images/banners/banner_dang_tro_nhanh.jpg"
                alt="Fast Booking"
                className="img-fluid"
              />
            </div>
          </Col>
          <Col md={4}>
            <div className="bg-primary bg-opacity-10 rounded p-2 text-center">
              <img
                src="https://tromoi.com/frontend/home/images/banners/banner_video_review.jpg"
                alt="Video Reviews"
                className="img-fluid"
              />
            </div>
          </Col>
        </Row>
      </Container>
      
      <HotListings roomType="APARTMENT" title="LỰA CHỌN CHỖ Ở HOT" />
      <RoomList />
      <HotListings roomType="WHOLE_HOUSE" title="NHÀ NGUYÊN CĂN CHO THUÊ" />
      <HotListings roomType="BOARDING_HOUSE" title="NHÀ TRỌ, PHÒNG TRỌ" />
      <ProvinceListings provinces={provinces} />
    </div>
  );
};

export default HomePage;
