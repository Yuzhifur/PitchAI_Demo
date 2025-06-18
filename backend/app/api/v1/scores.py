# File: backend/app/api/v1/scores.py

from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime
from ...models.score import (
    ProjectScores,
    ProjectScoresInDB,
    ScoreUpdate,
    DimensionScore,
    SubDimensionScore,
    MissingInformation,
    MissingInformationList,
    STANDARD_DIMENSIONS
)
from ...core.database import db

router = APIRouter()


def row_to_dimension_score(score_row: dict, sub_dimensions: List[dict]) -> DimensionScore:
    """Convert database rows to DimensionScore model"""
    sub_dim_scores = [
        SubDimensionScore(
            sub_dimension=sub['sub_dimension'],
            score=float(sub['score']),
            max_score=float(sub['max_score']),
            comments=sub['comments']
        )
        for sub in sub_dimensions
    ]

    return DimensionScore(
        dimension=score_row['dimension'],
        score=float(score_row['score']),
        max_score=float(score_row['max_score']),
        comments=score_row['comments'],
        sub_dimensions=sub_dim_scores
    )


@router.get("/projects/{project_id}/scores", response_model=ProjectScores)
async def get_project_scores(project_id: str):
    """Get scores for a specific project"""
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Begin transaction-like operations
        # First, delete existing scores and sub-scores for this project
        existing_scores = supabase.table("scores").select("id").eq("project_id", project_id).execute()

        for score_row in existing_scores.data:
            # Delete sub-dimensions first (due to foreign key constraints)
            supabase.table("score_details").delete().eq("score_id", score_row['id']).execute()

        # Delete main dimension scores
        supabase.table("scores").delete().eq("project_id", project_id).execute()

        # Insert new scores
        for dimension in score_update.dimensions:
            # Insert main dimension score
            score_id = str(uuid.uuid4())
            score_data = {
                "id": score_id,
                "project_id": project_id,
                "dimension": dimension.dimension,
                "score": dimension.score,
                "max_score": dimension.max_score,
                "comments": dimension.comments,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            supabase.table("scores").insert(score_data).execute()

            # Insert sub-dimension scores
            for sub_dim in dimension.sub_dimensions:
                sub_score_data = {
                    "id": str(uuid.uuid4()),
                    "score_id": score_id,
                    "sub_dimension": sub_dim.sub_dimension,
                    "score": sub_dim.score,
                    "max_score": sub_dim.max_score,
                    "comments": sub_dim.comments,
                    "created_at": datetime.utcnow().isoformat()
                }

                supabase.table("score_details").insert(sub_score_data).execute()

        # Update project status to completed if it has scores
        supabase.table("projects").update({
            "status": "completed",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", project_id).execute()

        # Return updated scores
        return await get_project_scores(project_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update scores: {str(e)}")


@router.get("/projects/{project_id}/missing-information", response_model=MissingInformationList)
async def get_missing_information(project_id: str):
    """Get missing information for a specific project"""
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get missing information
        result = supabase.table("missing_information").select("*").eq("project_id", project_id).execute()

        missing_items = [
            MissingInformation(
                dimension=row['dimension'],
                information_type=row['information_type'],
                description=row['description'],
                status=row['status']
            )
            for row in result.data
        ]

        return MissingInformationList(items=missing_items)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get missing information: {str(e)}")


@router.post("/projects/{project_id}/missing-information")
async def add_missing_information(
    project_id: str,
    missing_info: MissingInformation
):
    """Add missing information record for a project"""
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Insert missing information record
        missing_data = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "dimension": missing_info.dimension,
            "information_type": missing_info.information_type,
            "description": missing_info.description,
            "status": missing_info.status,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("missing_information").insert(missing_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to add missing information")

        # Update project status to needs_info if it's not already
        supabase.table("projects").update({
            "status": "needs_info",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", project_id).execute()

        return {"message": "Missing information added successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add missing information: {str(e)}")


@router.delete("/projects/{project_id}/missing-information/{info_id}")
async def remove_missing_information(project_id: str, info_id: str):
    """Remove a missing information record"""
    supabase = db.get_client()

    try:
        # Validate UUID formats
        try:
            uuid.UUID(project_id)
            uuid.UUID(info_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")

        # Delete the missing information record
        result = supabase.table("missing_information").delete().eq("id", info_id).eq("project_id", project_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Missing information record not found")

        # Check if there are any remaining missing information records
        remaining = supabase.table("missing_information").select("id").eq("project_id", project_id).execute()

        # If no missing information remains, update project status back to completed
        if not remaining.data:
            supabase.table("projects").update({
                "status": "completed",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", project_id).execute()

        return {"message": "Missing information removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove missing information: {str(e)}")


@router.get("/projects/{project_id}/scores/summary")
async def get_project_score_summary(project_id: str):
    """Get a summary of project scores including total and breakdown"""
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Get project with total score
        project_result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = project_result.data[0]

        # Get dimension scores
        scores_result = supabase.table("scores").select("dimension, score, max_score").eq("project_id", project_id).execute()

        dimension_breakdown = {}
        total_possible = 0

        for score_row in scores_result.data:
            dimension_breakdown[score_row['dimension']] = {
                "score": float(score_row['score']),
                "max_score": float(score_row['max_score']),
                "percentage": round((float(score_row['score']) / float(score_row['max_score'])) * 100, 1)
            }
            total_possible += float(score_row['max_score'])

        # Calculate overall percentage
        current_total = float(project['total_score']) if project['total_score'] else 0
        overall_percentage = round((current_total / total_possible) * 100, 1) if total_possible > 0 else 0

        # Determine recommendation based on score
        recommendation = "不符合入孵条件"
        if current_total >= 80:
            recommendation = "优秀项目，可考虑给予企业工位"
        elif current_total >= 60:
            recommendation = "符合基本入孵条件，可注册在工研院"

        return {
            "project_id": project_id,
            "project_name": project['project_name'],
            "enterprise_name": project['enterprise_name'],
            "total_score": current_total,
            "total_possible": total_possible,
            "overall_percentage": overall_percentage,
            "recommendation": recommendation,
            "dimension_breakdown": dimension_breakdown,
            "last_updated": project['updated_at']
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get score summary: {str(e)}")

@router.put("/projects/{project_id}/scores", response_model=ProjectScores)
async def update_project_scores(project_id: str, score_update: ScoreUpdate):
    """Update scores for a specific project"""
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get dimension scores
        scores_result = supabase.table("scores").select("*").eq("project_id", project_id).execute()

        # Get sub-dimension scores for all scores
        dimensions = []
        for score_row in scores_result.data:
            # Get sub-dimensions for this score
            sub_dims_result = supabase.table("score_details").select("*").eq("score_id", score_row['id']).execute()

            dimension_score = row_to_dimension_score(score_row, sub_dims_result.data)
            dimensions.append(dimension_score)

        # If no scores exist, return default structure with zero scores
        if not dimensions:
            dimensions = []
            for dim_name, dim_config in STANDARD_DIMENSIONS.items():
                sub_dimensions = []
                for sub_name, sub_max in dim_config["sub_dimensions"].items():
                    sub_dimensions.append(SubDimensionScore(
                        sub_dimension=sub_name,
                        score=0,
                        max_score=sub_max,
                        comments=""
                    ))

                dimensions.append(DimensionScore(
                    dimension=dim_name,
                    score=0,
                    max_score=dim_config["max_score"],
                    comments="",
                    sub_dimensions=sub_dimensions
                ))

        return ProjectScores(dimensions=dimensions)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scores: {str(e)}")