import React, { Component } from "react";
import { Button, Modal } from "react-bootstrap";

/**
 * The generic Error Modal
 */
export default class ErrorModal extends Component {
  /**
   * Renders the modal
   */
  render() {
    const { title, body, show, handleClose } = this.props;
    return (
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
