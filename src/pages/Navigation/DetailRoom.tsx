import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Carousel,
  Table,
  ListGroup,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaRuler,
  FaPhone,
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaRegCalendarAlt,
  FaUserAlt,
  FaAngleRight,
  FaStar,
} from "react-icons/fa";
import roomApi from "../../apis/room.api";
import reviewAPI from "../../apis/review.api";
import userApi from "../../apis/user.api";
import { RoomGetByID, RoomImage } from "../../types/room.type";
import { toast } from "react-toastify";
import RoomMap from "../../components/common/Map/RoomMap";
import addressAPI from "../../apis/address.api";
import { get, set } from "lodash";

export default function DetailRoom() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<RoomGetByID | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [address, setAddress] = useState<string | "">("");
  const [similarRoomsError, setSimilarRoomsError] = useState<string | null>(
    null
  );
  const maxRetries = 3;

  // State cho modal đánh giá
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);

  // State cho modal thông báo thành công
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // State để lưu userId
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch room details by ID
  useEffect(() => {
    const fetchRoomDetails = async (attempt = 1) => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        const response = await roomApi.getRoomById(Number(id));
        if (response?.data?.data) {
          setRoom(response.data.data);

          const address = response.data.data.address;
          setAddress(
            `${address.houseNumber}, ${address.street}, ${address.ward}, ${address.district}, ${address.province}`
          );

        }
      } catch (error) {
        console.error("Error fetching room details:", error);
        if (attempt <= maxRetries) {
          const delay = 3000 + (attempt - 1) * 1000;
          setTimeout(() => fetchRoomDetails(attempt + 1), delay);
        } else {
          setError("Không thể tải thông tin phòng. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchRoomDetails();
  }, [id]);

  // Fetch user profile to get userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.log("No access token found, user not logged in.");
        return;
      }

      try {
        const response = await userApi.getProfile();
        if (response.data.success) {
          setUserId(response.data.data.id);
        } else {
          throw new Error(
            response.data.message || "Lỗi khi lấy thông tin người dùng"
          );
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        toast.error("Không thể lấy thông tin người dùng. Vui lòng thử lại.");
      }
    };

    fetchUserProfile();
  }, []);

  const [similarRooms, setSimilarRooms] = useState<any[]>([]);
  const getSimilarRoom = async (attempt = 1) => {
    try {
      console.log(`Attempt ${attempt}: Loading similar rooms data...`);
      const response = await roomApi.aiGetSimilarRoom(room!.id);
      setSimilarRooms(response.data.data);
      setSimilarRoomsError(null);
      console.log("Successfully loaded similar rooms");
    } catch (error) {
      console.error("Error fetching similar rooms:", error);
      if (attempt <= maxRetries) {
        const delay = 3000 + (attempt - 1) * 1000;
        setTimeout(() => getSimilarRoom(attempt + 1), delay);
      } else {
        setSimilarRoomsError(
          "Không thể tải danh sách phòng tương tự. Vui lòng thử lại sau."
        );
      }
    }
  };

  useEffect(() => {
    if (!room) return;
    getSimilarRoom();
  }, [room]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!room) return;

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      try {
        const response = await roomApi.getSavedRoomIds();
        console.log("Saved rooms response:", response.data);

        if (response.data?.data?.roomIds) {
          const isSaved = response.data.data.roomIds.includes(room.id);
          console.log(`Room ${room.id} saved status:`, isSaved);
          setIsFavorite(isSaved);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    checkFavoriteStatus();
  }, [room]);

  const handleToggleFavorite = async () => {
    if (!room) return;

    const isLoggedIn = localStorage.getItem("accessToken");
    if (!isLoggedIn) {
      toast.info("Vui lòng đăng nhập để lưu phòng trọ yêu thích");
      return;
    }

    try {
      if (!isFavorite) {
        await roomApi.addToWishList(room.id);
        toast.success("Đã lưu tin thành công");
      } else {
        await roomApi.removeFromWishList(room.id);
        toast.success("Đã xóa tin khỏi danh sách yêu thích");
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: room?.title,
          text: `Xem phòng trọ: ${room?.title}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => toast.success("Đã sao chép liên kết vào clipboard"))
        .catch(() => toast.error("Không thể sao chép liên kết"));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
    }
  };

  const handleSubmitReview = async () => {
    if (!room) return;

    // Kiểm tra đăng nhập
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.info("Vui lòng đăng nhập để gửi đánh giá");
      setShowReviewModal(false);
      return;
    }

    // Kiểm tra userId
    if (!userId) {
      toast.error("Không thể xác định thông tin người dùng. Vui lòng thử lại.");
      setShowReviewModal(false);
      return;
    }

    // Kiểm tra dữ liệu nhập
    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn điểm số từ 1 đến 5");
      return;
    }
    if (!comment.trim()) {
      toast.error("Vui lòng nhập bình luận");
      return;
    }

    try {
      const uploadedImages: RoomImage[] = images.map((file, index) => ({
        publicId: `local-${index}-${file.name}`,
        imageUrl: URL.createObjectURL(file),
      }));

      const reviewData = {
        roomId: room.id,
        userId: userId,
        rating: rating,
        comment: comment,
        images: uploadedImages,
      };

      const response = await reviewAPI.createReview(reviewData);
      if (response.data.success) {
        // Đóng modal đánh giá và mở modal thông báo thành công
        setShowReviewModal(false);
        setShowSuccessModal(true);
        // Reset các trường
        setRating(0);
        setComment("");
        setImages([]);
      } else {
        throw new Error(response.data.message || "Lỗi khi gửi đánh giá");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container className="py-5">
        <div className="alert alert-warning">Không tìm thấy phòng trọ này.</div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        {/* Main Content */}
        <Col lg={9}>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link
                  to="/"
                  className="text-primary text-decoration-none fw-bold"
                >
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link
                  className="text-muted text-decoration-none fw-bold"
                  to={`/category/${
                    room.roomType === "BOARDING_HOUSE"
                      ? "nha-tro-phong-tro"
                      : room.roomType === "WHOLE_HOUSE"
                      ? "nha-nguyen-can"
                      : "can-ho"
                  }`}
                >
                  {room.roomType === "BOARDING_HOUSE"
                    ? "Phòng trọ"
                    : room.roomType === "WHOLE_HOUSE"
                    ? "Nhà nguyên căn"
                    : "Căn hộ"}
                </Link>
              </li>
              <li
                className="breadcrumb-item active text-muted text-decoration-none fw-bold"
                aria-current="page"
              >
                {room.title}
              </li>
            </ol>
          </nav>

          {/* Room Title Section */}
          <div className="mb-4">
            <h1 className="h3 fw-bold">{room.title}</h1>
            <div className="d-flex align-items-center mt-2">
              <FaMapMarkerAlt className="text-secondary me-1" />
              <span className="text-secondary">
                {room.address.houseNumber}, {room.address.street},{" "}
                {room.address.ward}, {room.address.district},{" "}
                {room.address.province}
              </span>
            </div>
          </div>

          {/* Image Carousel */}
          <Card className="border-0 shadow-sm mb-4">
            <Carousel
              activeIndex={activeIndex}
              onSelect={(selectedIndex) => setActiveIndex(selectedIndex)}
              interval={null}
              className="room-carousel"
            >
              {room.images.map((image, index) => (
                <Carousel.Item key={index}>
                  <div
                    style={{
                      height: "500px",
                      backgroundColor: "#f8f9fa",
                      position: "relative",
                    }}
                  >
                    <img
                      className="d-block w-100 h-100"
                      src={image.imageUrl}
                      alt={`Hình ${index + 1} của ${room.title}`}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>

            <div className="d-flex mt-2 p-2 justify-content-start overflow-auto">
              {room.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    cursor: "pointer",
                    width: "80px",
                    height: "60px",
                    marginRight: "10px",
                    border:
                      activeIndex === index
                        ? "2px solid #007bff"
                        : "1px solid #dee2e6",
                    padding: "2px",
                  }}
                >
                  <img
                    src={image.imageUrl}
                    alt={`Thumbnail ${index}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Room Details */}
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="h-100 bg-light border-0">
                <Card.Body className="text-center">
                  <div className="text-primary h5 mb-1">Giá thuê</div>
                  <div className="h3 text-danger fw-bold">
                    {room.price} đ/tháng
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3">
              <Card className="h-100 bg-light border-0">
                <Card.Body className="text-center">
                  <div className="text-primary h5 mb-1">Diện tích</div>
                  <div className="h3 fw-bold">{room.area} m²</div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3">
              <Card className="h-100 bg-light border-0">
                <Card.Body className="text-center">
                  <div className="text-primary h5 mb-1">Đặt cọc</div>
                  <div className="h3 fw-bold">{room.deposit} đ</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Nút Đánh giá phòng */}
          <div className="mb-4">
            <Button variant="success" onClick={() => setShowReviewModal(true)}>
              <FaStar className="me-2" />
              Đánh giá phòng
            </Button>
          </div>

          {/* Room Specification */}
          <h4 className="mb-3 fw-bold">Thông tin mô tả</h4>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <p style={{ whiteSpace: "pre-line" }}>{room.description}</p>
            </Card.Body>
          </Card>

          {/* Room Features */}
          <h4 className="mb-3 fw-bold">Đặc điểm phòng trọ</h4>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Table striped>
                <tbody>
                  <tr>
                    <td width="30%">Loại phòng:</td>
                    <td>
                      {room.roomType === "BOARDING_HOUSE"
                        ? "Phòng trọ"
                        : room.roomType === "WHOLE_HOUSE"
                        ? "Nhà nguyên căn"
                        : "Căn hộ"}
                    </td>
                  </tr>
                  <tr>
                    <td>Đối tượng cho thuê:</td>
                    <td>
                      {room.forGender === "ALL"
                        ? "Tất cả"
                        : room.forGender === "MALE"
                        ? "Nam"
                        : "Nữ"}
                    </td>
                  </tr>
                  <tr>
                    <td>Số phòng:</td>
                    <td>{room.totalRooms} phòng</td>
                  </tr>
                  <tr>
                    <td>Số người tối đa:</td>
                    <td>{room.maxPeople} người</td>
                  </tr>
                  <tr>
                    <td>Số phòng ngủ:</td>
                    <td>{room.numberOfBedrooms} phòng</td>
                  </tr>
                  <tr>
                    <td>Số phòng tắm:</td>
                    <td>{room.numberOfBathrooms} phòng</td>
                  </tr>
                  <tr>
                    <td>Nhà bếp:</td>
                    <td>{room.numberOfKitchens} phòng</td>
                  </tr>
                  <tr>
                    <td>Phòng khách:</td>
                    <td>{room.numberOfLivingRooms} phòng</td>
                  </tr>
                  <tr>
                    <td>Trọ tự quản:</td>
                    <td>{room.selfManaged ? "Có" : "Không"}</td>
                  </tr>
                  <tr>
                    <td>Ngày đăng:</td>
                    <td>{room.createdAt}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Amenities */}
          <h4 className="mb-3 fw-bold">Tiện nghi</h4>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                {room.amenities.map((amenity, index) => (
                  <Col md={4} key={index} className="mb-2">
                    <div className="d-flex align-items-center">
                      <FaAngleRight className="text-primary me-2" />
                      <span>{amenity.name}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Target Audience */}
          <h4 className="mb-3 fw-bold">Đối tượng thuê phù hợp</h4>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                {room.targetAudiences.map((audience, index) => (
                  <Col md={4} key={index} className="mb-2">
                    <div className="d-flex align-items-center">
                      <FaAngleRight className="text-primary me-2" />
                      <span>{audience.name}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Surrounding Environment */}
          <h4 className="mb-3 fw-bold">Khu vực xung quanh</h4>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                {room.surroundingAreas.map((area, index) => (
                  <Col md={4} key={index} className="mb-2">
                    <div className="d-flex align-items-center">
                      <FaAngleRight className="text-primary me-2" />
                      <span>{area.name}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Location Map */}
          <h4 className="mb-3 fw-bold">Vị trí trên bản đồ</h4>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div
                className="map-container"
                style={{
                  height: "400px",
                  backgroundColor: "#f5f5f5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                  <RoomMap
                    latitude={10.8305312}
      longitude={106.6846849}
                    roomTitle="Phòng trọ ở khu vực này"
                    roomAddress = {address}
                  />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex mb-3">
                <div
                  className="avatar me-3 bg-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <FaUserAlt className="text-primary" />
                </div>
                <div>
                  <h5 className="mb-1">{room.posterName}</h5>
                  <div className="small">
                    <FaRegCalendarAlt className="me-1" /> Đã đăng:{" "}
                    {room.createdAt}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <Button
                  variant="primary"
                  className="w-100 mb-2"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  <FaPhone className="me-2" />
                  {showPhone ? room.posterPhone : "Hiện số điện thoại"}
                </Button>

                <Button
                  variant={isFavorite ? "danger" : "outline-danger"}
                  className="w-100 mb-2"
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? (
                    <FaHeart className="me-2" />
                  ) : (
                    <FaRegHeart className="me-2" />
                  )}
                  {isFavorite ? "Đã lưu" : "Lưu tin"}
                </Button>

                <Button
                  variant="outline-primary"
                  className="w-100"
                  onClick={handleShare}
                >
                  <FaShareAlt className="me-2" /> Chia sẻ
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0">Phòng trọ tương tự</h5>
            </Card.Header>
            {similarRoomsError ? (
              <div className="alert alert-danger m-3">
                {similarRoomsError}
                <Button
                  variant="primary"
                  size="sm"
                  className="ms-2"
                  onClick={() => getSimilarRoom()}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <ListGroup variant="flush">
                {similarRooms.length > 0
                  ? similarRooms.map((similarRoom) => (
                      <ListGroup.Item
                        key={similarRoom.id}
                        action
                        className="py-3"
                      >
                        <Link
                          to={`/detail-room/${similarRoom.id}`}
                          className="text-decoration-none text-dark"
                        >
                          <Row className="g-2">
                            <Col xs={4}>
                              <div
                                style={{
                                  height: "60px",
                                  backgroundColor: "#f5f5f5",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}
                              >
                                {similarRoom.imageUrls && (
                                  <img
                                    src={similarRoom.imageUrls[0]}
                                    alt={similarRoom.title}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </div>
                            </Col>
                            <Col xs={8}>
                              <div
                                className="small fw-bold mb-1"
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {similarRoom.title}
                              </div>
                              <div className="small text-danger">
                                {similarRoom.price} đ/tháng
                              </div>
                              <div className="d-flex align-items-center">
                                <div className="small text-secondary me-2">
                                  {similarRoom.area} m²
                                </div>
                                <div className="small text-secondary text-truncate">
                                  <FaMapMarkerAlt size={10} className="me-1" />
                                  {similarRoom.address?.district},{" "}
                                  {similarRoom.address?.province}
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Link>
                      </ListGroup.Item>
                    ))
                  : [1, 2, 3].map((item) => (
                      <ListGroup.Item key={item} className="py-3">
                        <div className="text-muted">
                          Không có phòng tương tự
                        </div>
                      </ListGroup.Item>
                    ))}
              </ListGroup>
            )}
            <Card.Footer className="bg-white text-center">
              <Link
                to={`/${
                  room.roomType === "BOARDING_HOUSE"
                    ? "phong-tro"
                    : room.roomType === "WHOLE_HOUSE"
                    ? "nha-nguyen-can"
                    : "can-ho"
                }`}
                className="text-decoration-none"
              >
                Xem thêm <FaAngleRight />
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá phòng trọ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Điểm số (1-5)</Form.Label>
              <div className="d-flex align-items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    size={24}
                    className="me-1"
                    color={star <= rating ? "#ffc107" : "#e4e5e9"}
                    style={{ cursor: "pointer" }}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bình luận</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập bình luận của bạn..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleSubmitReview}>
            Gửi đánh giá
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thông báo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-success">
            Đánh giá của bạn đã được gửi thành công!
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
